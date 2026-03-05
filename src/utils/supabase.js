import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload file to Supabase Storage
export const uploadFile = async (file, bucket, path) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('لم يتم اختيار ملف');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('حجم الملف كبير جداً (الحد الأقصى 10 ميجا)');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('نوع الملف غير مدعوم (صور، PDF، Word فقط)');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    console.log('Uploading file to Supabase:', filePath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(error.message || 'فشل رفع الملف');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('File uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء رفع الملف'
    };
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (bucket, path) => {
  try {
    if (!path) {
      throw new Error('مسار الملف غير صحيح');
    }

    console.log('Deleting file from Supabase:', path);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(error.message || 'فشل حذف الملف');
    }

    console.log('File deleted successfully');

    return { 
      success: true,
      message: 'تم حذف الملف بنجاح'
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء حذف الملف'
    };
  }
};

// Check if bucket exists
export const checkBucket = async (bucket) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error) {
      console.error('Bucket check error:', error);
      return { success: false, exists: false };
    }

    return { success: true, exists: !!data };
  } catch (error) {
    console.error('Error checking bucket:', error);
    return { success: false, exists: false };
  }
};

// List files in a path
export const listFiles = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) throw error;

    return {
      success: true,
      files: data
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      success: false,
      error: error.message,
      files: []
    };
  }
};
