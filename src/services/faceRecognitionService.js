import * as faceapi from '@vladmandic/face-api';
import { supabase } from '../utils/supabase';

let modelsLoaded = false;

// Load face-api models
export const loadModels = async () => {
  if (modelsLoaded) return true;

  try {
    // Use CDN for models (more reliable than local files)
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    return false;
  }
};

// Get face descriptor from image
export const getFaceDescriptor = async (imageElement) => {
  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('لم يتم اكتشاف وجه في الصورة');
    }

    return Array.from(detection.descriptor);
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    throw error;
  }
};

// Upload image to Supabase Storage
const uploadImageToStorage = async (imageDataUrl, folder) => {
  try {
    if (!supabase) {
      throw new Error('Supabase غير مُعد بشكل صحيح');
    }

    // Convert base64 to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${folder}/${timestamp}-${random}.jpg`;

    console.log('Uploading image to Storage:', fileName);

    // Upload to Supabase Storage - bucket خاص بالـ Face Recognition فقط
    const { data, error } = await supabase.storage
      .from('face-recognition')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(error.message || 'فشل رفع الصورة');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('face-recognition')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Register admin face
export const registerAdminFace = async (imageDataUrl, adminName, adminEmail = '') => {
  try {
    if (!supabase) {
      throw new Error('Supabase غير مُعد بشكل صحيح');
    }

    // Create image element from data URL
    const img = await createImageFromDataUrl(imageDataUrl);
    
    // Get face descriptor
    const descriptor = await getFaceDescriptor(img);

    // Upload image to Storage
    const uploadResult = await uploadImageToStorage(imageDataUrl, 'admin-faces');

    // Save to Supabase database with pending status
    const { data, error} = await supabase
      .from('admin_faces')
      .insert([
        {
          name: adminName,
          email: adminEmail || null,
          descriptor: descriptor,
          image_url: uploadResult.url,
          uploaded_at: new Date().toISOString(),
          status: 'pending',
          active: false
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'فشل حفظ البيانات');
    }

    console.log('Admin face registered successfully (pending approval):', data);

    return {
      success: true,
      message: 'تم إرسال طلب التسجيل بنجاح'
    };
  } catch (error) {
    console.error('Error registering admin face:', error);
    throw error;
  }
};

// Get all registered admin faces
export const getRegisteredAdminFaces = async () => {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('admin_faces')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error getting admin faces:', error);
      return [];
    }

    console.log('Found admin faces:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error getting admin faces:', error);
    return [];
  }
};

// Verify face against registered admins
export const verifyAdminFace = async (imageDataUrl) => {
  try {
    // Create image element from data URL
    const img = await createImageFromDataUrl(imageDataUrl);
    
    // Get face descriptor from captured image
    const capturedDescriptor = await getFaceDescriptor(img);

    // Get all registered admin faces
    const adminFaces = await getRegisteredAdminFaces();

    if (adminFaces.length === 0) {
      return {
        success: false,
        message: 'لا يوجد وجوه مسجلة للأدمن',
        needsRegistration: true
      };
    }

    // Compare with each registered admin face
    const threshold = 0.6; // Lower is more strict
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const adminFace of adminFaces) {
      const distance = faceapi.euclideanDistance(
        capturedDescriptor,
        adminFace.descriptor
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = adminFace;
      }
    }

    // Check if match is good enough
    if (bestDistance < threshold) {
      return {
        success: true,
        message: `مرحباً ${bestMatch.name}`,
        adminName: bestMatch.name,
        confidence: (1 - bestDistance) * 100
      };
    } else {
      // Unauthorized access attempt - save the image
      await logUnauthorizedAccess(imageDataUrl, bestDistance);
      
      return {
        success: false,
        message: 'وجه غير مصرح له',
        distance: bestDistance
      };
    }
  } catch (error) {
    console.error('Error verifying face:', error);
    throw error;
  }
};

// Log unauthorized access attempts
export const logUnauthorizedAccess = async (imageDataUrl, distance = null) => {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    // Upload image to Storage
    const uploadResult = await uploadImageToStorage(imageDataUrl, 'unauthorized-attempts');

    const ipAddress = await getClientIP();

    const { error } = await supabase
      .from('unauthorized_access_attempts')
      .insert([
        {
          image_url: uploadResult.url,
          timestamp: new Date().toISOString(),
          distance: distance,
          user_agent: navigator.userAgent,
          ip_address: ipAddress
        }
      ]);

    if (error) {
      console.error('Error logging unauthorized access:', error);
    } else {
      console.log('Unauthorized access attempt logged');
    }
  } catch (error) {
    console.error('Error logging unauthorized access:', error);
  }
};

// Get unauthorized access attempts
export const getUnauthorizedAttempts = async (limitCount = 50) => {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('unauthorized_access_attempts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error getting unauthorized attempts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting unauthorized attempts:', error);
    return [];
  }
};

// Helper: Create image element from data URL
const createImageFromDataUrl = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// Helper: Get client IP (approximate)
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

// Check if any admin face is registered
export const isAdminFaceRegistered = async () => {
  const adminFaces = await getRegisteredAdminFaces();
  return adminFaces.length > 0;
};

// Delete a single unauthorized attempt
export const deleteUnauthorizedAttempt = async (attemptId) => {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get the attempt to delete the image from storage
    const { data: attempt, error: fetchError } = await supabase
      .from('unauthorized_access_attempts')
      .select('image_url')
      .eq('id', attemptId)
      .single();

    if (fetchError) {
      console.error('Error fetching attempt:', fetchError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('unauthorized_access_attempts')
      .delete()
      .eq('id', attemptId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Delete image from storage if exists
    if (attempt && attempt.image_url) {
      try {
        const urlParts = attempt.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `unauthorized-attempts/${fileName}`;

        await supabase.storage
          .from('face-recognition')
          .remove([filePath]);
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting unauthorized attempt:', error);
    throw error;
  }
};

// Delete all unauthorized attempts
export const deleteAllUnauthorizedAttempts = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get all attempts to delete images from storage
    const { data: attempts, error: fetchError } = await supabase
      .from('unauthorized_access_attempts')
      .select('image_url');

    if (fetchError) {
      console.error('Error fetching attempts:', fetchError);
    }

    // Delete all from database
    const { error: deleteError } = await supabase
      .from('unauthorized_access_attempts')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Delete all images from storage
    if (attempts && attempts.length > 0) {
      try {
        const filePaths = attempts
          .filter(a => a.image_url)
          .map(a => {
            const urlParts = a.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            return `unauthorized-attempts/${fileName}`;
          });

        if (filePaths.length > 0) {
          await supabase.storage
            .from('face-recognition')
            .remove(filePaths);
        }
      } catch (storageError) {
        console.error('Error deleting images from storage:', storageError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting all unauthorized attempts:', error);
    throw error;
  }
};
