import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const ATTENDANCE_COLLECTION = 'attendance';

// Record attendance
export const recordAttendance = async (userId, eventId, scannedBy, userInfo) => {
  try {
    // Check if user already attended this event
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('userId', '==', userId),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        success: false,
        error: 'duplicate',
        message: 'المستخدم سجل حضوره بالفعل في هذه الفعالية'
      };
    }

    // Record new attendance
    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      userId,
      eventId,
      scannedBy,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userGovernorate: userInfo.governorate,
      userCommittee: userInfo.committee,
      userRole: userInfo.role,
      timestamp: new Date().toISOString(),
      createdAt: Timestamp.now()
    });

    return {
      success: true,
      attendanceId: docRef.id,
      message: 'تم تسجيل الحضور بنجاح'
    };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance by event
export const getAttendanceByEvent = async (eventId) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      attendance
    };
  } catch (error) {
    console.error('Error getting attendance:', error);
    return {
      success: false,
      error: error.message,
      attendance: []
    };
  }
};

// Get attendance by user
export const getAttendanceByUser = async (userId) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      attendance
    };
  } catch (error) {
    console.error('Error getting user attendance:', error);
    return {
      success: false,
      error: error.message,
      attendance: []
    };
  }
};

// Get today's attendance
export const getTodayAttendance = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      attendance,
      count: attendance.length
    };
  } catch (error) {
    console.error('Error getting today attendance:', error);
    return {
      success: false,
      error: error.message,
      attendance: [],
      count: 0
    };
  }
};

// Listen to attendance in real-time
export const listenToAttendance = (eventId, callback) => {
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const attendance = [];
    querySnapshot.forEach((doc) => {
      attendance.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(attendance);
  });
};

// Get attendance statistics
export const getAttendanceStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    
    const stats = {
      total: querySnapshot.size,
      byEvent: {},
      byUser: {},
      byGovernorate: {},
      byCommittee: {}
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Count by event
      stats.byEvent[data.eventId] = (stats.byEvent[data.eventId] || 0) + 1;
      
      // Count by user
      stats.byUser[data.userId] = (stats.byUser[data.userId] || 0) + 1;
      
      // Count by governorate
      if (data.userGovernorate) {
        stats.byGovernorate[data.userGovernorate] = 
          (stats.byGovernorate[data.userGovernorate] || 0) + 1;
      }
      
      // Count by committee
      if (data.userCommittee) {
        stats.byCommittee[data.userCommittee] = 
          (stats.byCommittee[data.userCommittee] || 0) + 1;
      }
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
