import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

const POINTS_COLLECTION = 'userPoints';

// Points configuration
export const POINTS_CONFIG = {
  ATTENDANCE: 10,
  TASK_SUBMISSION: 20,
  TASK_APPROVED: 30,
  EVENT_PARTICIPATION: 15
};

// Initialize user points
export const initializeUserPoints = async (userId, userInfo) => {
  try {
    const userPointsRef = doc(db, POINTS_COLLECTION, userId);
    const docSnap = await getDoc(userPointsRef);

    if (!docSnap.exists()) {
      await setDoc(userPointsRef, {
        userId,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userGovernorate: userInfo.governorate,
        userCommittee: userInfo.committee,
        userRole: userInfo.role,
        totalPoints: 0,
        attendancePoints: 0,
        taskPoints: 0,
        participationPoints: 0,
        eventsAttended: 0,
        tasksSubmitted: 0,
        tasksApproved: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing user points:', error);
    return { success: false, error: error.message };
  }
};

// Add points for attendance
export const addAttendancePoints = async (userId, userInfo) => {
  try {
    await initializeUserPoints(userId, userInfo);
    
    const userPointsRef = doc(db, POINTS_COLLECTION, userId);
    await updateDoc(userPointsRef, {
      totalPoints: increment(POINTS_CONFIG.ATTENDANCE),
      attendancePoints: increment(POINTS_CONFIG.ATTENDANCE),
      eventsAttended: increment(1),
      lastActivity: new Date().toISOString()
    });

    return {
      success: true,
      points: POINTS_CONFIG.ATTENDANCE,
      message: `تم إضافة ${POINTS_CONFIG.ATTENDANCE} نقطة للحضور`
    };
  } catch (error) {
    console.error('Error adding attendance points:', error);
    return { success: false, error: error.message };
  }
};

// Add points for task submission
export const addTaskSubmissionPoints = async (userId, userInfo) => {
  try {
    await initializeUserPoints(userId, userInfo);
    
    const userPointsRef = doc(db, POINTS_COLLECTION, userId);
    await updateDoc(userPointsRef, {
      totalPoints: increment(POINTS_CONFIG.TASK_SUBMISSION),
      taskPoints: increment(POINTS_CONFIG.TASK_SUBMISSION),
      tasksSubmitted: increment(1),
      lastActivity: new Date().toISOString()
    });

    return {
      success: true,
      points: POINTS_CONFIG.TASK_SUBMISSION,
      message: `تم إضافة ${POINTS_CONFIG.TASK_SUBMISSION} نقطة لرفع المهمة`
    };
  } catch (error) {
    console.error('Error adding task submission points:', error);
    return { success: false, error: error.message };
  }
};

// Add points for approved task
export const addTaskApprovalPoints = async (userId) => {
  try {
    const userPointsRef = doc(db, POINTS_COLLECTION, userId);
    await updateDoc(userPointsRef, {
      totalPoints: increment(POINTS_CONFIG.TASK_APPROVED),
      taskPoints: increment(POINTS_CONFIG.TASK_APPROVED),
      tasksApproved: increment(1),
      lastActivity: new Date().toISOString()
    });

    return {
      success: true,
      points: POINTS_CONFIG.TASK_APPROVED,
      message: `تم إضافة ${POINTS_CONFIG.TASK_APPROVED} نقطة لقبول المهمة`
    };
  } catch (error) {
    console.error('Error adding task approval points:', error);
    return { success: false, error: error.message };
  }
};

// Get user points
export const getUserPoints = async (userId) => {
  try {
    const userPointsRef = doc(db, POINTS_COLLECTION, userId);
    const docSnap = await getDoc(userPointsRef);

    if (docSnap.exists()) {
      return {
        success: true,
        points: docSnap.data()
      };
    } else {
      return {
        success: true,
        points: {
          totalPoints: 0,
          attendancePoints: 0,
          taskPoints: 0,
          participationPoints: 0,
          eventsAttended: 0,
          tasksSubmitted: 0,
          tasksApproved: 0
        }
      };
    }
  } catch (error) {
    console.error('Error getting user points:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard
export const getLeaderboard = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, POINTS_COLLECTION),
      orderBy('totalPoints', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    
    querySnapshot.forEach((doc, index) => {
      leaderboard.push({
        rank: index + 1,
        userId: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      leaderboard
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return {
      success: false,
      error: error.message,
      leaderboard: []
    };
  }
};

// Get user rank
export const getUserRank = async (userId) => {
  try {
    const userPoints = await getUserPoints(userId);
    
    if (!userPoints.success) {
      return { success: false, error: userPoints.error };
    }

    const q = query(
      collection(db, POINTS_COLLECTION),
      orderBy('totalPoints', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    let rank = 0;
    
    querySnapshot.forEach((doc, index) => {
      if (doc.id === userId) {
        rank = index + 1;
      }
    });

    return {
      success: true,
      rank,
      totalUsers: querySnapshot.size
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { success: false, error: error.message };
  }
};

// Get points statistics
export const getPointsStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, POINTS_COLLECTION));
    
    const stats = {
      totalUsers: querySnapshot.size,
      totalPoints: 0,
      averagePoints: 0,
      topUser: null,
      byGovernorate: {},
      byCommittee: {}
    };

    let maxPoints = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalPoints += data.totalPoints || 0;
      
      // Find top user
      if (data.totalPoints > maxPoints) {
        maxPoints = data.totalPoints;
        stats.topUser = {
          userId: doc.id,
          ...data
        };
      }
      
      // Count by governorate
      if (data.userGovernorate) {
        if (!stats.byGovernorate[data.userGovernorate]) {
          stats.byGovernorate[data.userGovernorate] = {
            users: 0,
            totalPoints: 0
          };
        }
        stats.byGovernorate[data.userGovernorate].users++;
        stats.byGovernorate[data.userGovernorate].totalPoints += data.totalPoints || 0;
      }
      
      // Count by committee
      if (data.userCommittee) {
        if (!stats.byCommittee[data.userCommittee]) {
          stats.byCommittee[data.userCommittee] = {
            users: 0,
            totalPoints: 0
          };
        }
        stats.byCommittee[data.userCommittee].users++;
        stats.byCommittee[data.userCommittee].totalPoints += data.totalPoints || 0;
      }
    });

    stats.averagePoints = stats.totalUsers > 0 
      ? Math.round(stats.totalPoints / stats.totalUsers) 
      : 0;

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error getting points stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
