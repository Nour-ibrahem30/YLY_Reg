import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile, deleteFile } from '../utils/supabase';

const TASKS_COLLECTION = 'tasks';
const STORAGE_BUCKET = 'yly-tasks';

// Submit task
export const submitTask = async (userId, eventId, file, userInfo) => {
  try {
    console.log('Starting task submission...', { userId, eventId, fileName: file.name });
    
    // Upload file to Supabase
    const uploadResult = await uploadFile(
      file, 
      STORAGE_BUCKET, 
      `${userId}/${eventId}`
    );

    console.log('Upload result:', uploadResult);

    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult.error);
      return {
        success: false,
        error: uploadResult.error || 'فشل رفع الملف إلى التخزين السحابي'
      };
    }

    // Save task to Firestore
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      userId,
      eventId,
      fileUrl: uploadResult.url,
      filePath: uploadResult.path,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userGovernorate: userInfo.governorate,
      userCommittee: userInfo.committee,
      userRole: userInfo.role,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      taskId: docRef.id,
      message: 'تم رفع المهمة بنجاح'
    };
  } catch (error) {
    console.error('Error submitting task:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update task status
export const updateTaskStatus = async (taskId, status, reviewedBy, notes = '') => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      status,
      reviewedBy,
      reviewNotes: notes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `تم ${status === 'approved' ? 'قبول' : 'رفض'} المهمة بنجاح`
    };
  } catch (error) {
    console.error('Error updating task status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get tasks by event
export const getTasksByEvent = async (eventId) => {
  try {
    // Try with orderBy first
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      tasks
    };
  } catch (error) {
    console.error('Error getting tasks with orderBy, trying without:', error);
    
    // Fallback: Try without orderBy if index doesn't exist
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('eventId', '==', eventId)
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort in JavaScript instead
      tasks.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Descending order
      });

      return {
        success: true,
        tasks
      };
    } catch (fallbackError) {
      console.error('Error getting tasks (fallback):', fallbackError);
      return {
        success: false,
        error: fallbackError.message,
        tasks: []
      };
    }
  }
};

// Get tasks by user
export const getTasksByUser = async (userId) => {
  try {
    // Try with orderBy first
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      tasks
    };
  } catch (error) {
    console.error('Error getting tasks with orderBy, trying without:', error);
    
    // Fallback: Try without orderBy if index doesn't exist
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort in JavaScript instead
      tasks.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Descending order
      });

      return {
        success: true,
        tasks
      };
    } catch (fallbackError) {
      console.error('Error getting tasks (fallback):', fallbackError);
      return {
        success: false,
        error: fallbackError.message,
        tasks: []
      };
    }
  }
};

// Get pending tasks
export const getPendingTasks = async () => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      tasks
    };
  } catch (error) {
    console.error('Error getting pending tasks:', error);
    return {
      success: false,
      error: error.message,
      tasks: []
    };
  }
};

// Listen to tasks in real-time
export const listenToTasks = (callback, filters = {}) => {
  let q = collection(db, TASKS_COLLECTION);
  
  const constraints = [orderBy('createdAt', 'desc')];
  
  if (filters.eventId) {
    constraints.unshift(where('eventId', '==', filters.eventId));
  }
  
  if (filters.userId) {
    constraints.unshift(where('userId', '==', filters.userId));
  }
  
  if (filters.status) {
    constraints.unshift(where('status', '==', filters.status));
  }
  
  q = query(q, ...constraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(tasks);
  });
};

// Delete task
export const deleteTask = async (taskId, filePath) => {
  try {
    // Delete file from Supabase
    if (filePath) {
      await deleteFile(STORAGE_BUCKET, filePath);
    }

    // Delete task from Firestore
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));

    return {
      success: true,
      message: 'تم حذف المهمة بنجاح'
    };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get task statistics
export const getTaskStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
    
    const stats = {
      total: querySnapshot.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      byEvent: {},
      byUser: {}
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Count by status
      if (data.status === 'pending') stats.pending++;
      if (data.status === 'approved') stats.approved++;
      if (data.status === 'rejected') stats.rejected++;
      
      // Count by event
      stats.byEvent[data.eventId] = (stats.byEvent[data.eventId] || 0) + 1;
      
      // Count by user
      stats.byUser[data.userId] = (stats.byUser[data.userId] || 0) + 1;
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
