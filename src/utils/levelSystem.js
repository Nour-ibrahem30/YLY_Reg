// Level System for YLY Platform

// Level thresholds (points required for each level)
const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, maxPoints: 99, title: 'مبتدئ', color: '#9CA3AF' },
  { level: 2, minPoints: 100, maxPoints: 249, title: 'نشيط', color: '#10B981' },
  { level: 3, minPoints: 250, maxPoints: 499, title: 'متميز', color: '#3B82F6' },
  { level: 4, minPoints: 500, maxPoints: 999, title: 'محترف', color: '#8B5CF6' },
  { level: 5, minPoints: 1000, maxPoints: 1999, title: 'خبير', color: '#F59E0B' },
  { level: 6, minPoints: 2000, maxPoints: 3999, title: 'نجم', color: '#EF4444' },
  { level: 7, minPoints: 4000, maxPoints: 7999, title: 'أسطورة', color: '#EC4899' },
  { level: 8, minPoints: 8000, maxPoints: 15999, title: 'بطل', color: '#8B5CF6' },
  { level: 9, minPoints: 16000, maxPoints: 31999, title: 'عملاق', color: '#6366F1' },
  { level: 10, minPoints: 32000, maxPoints: Infinity, title: 'إمبراطور', color: '#F59E0B' }
];

// Get user level based on points
export const getUserLevel = (points) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
};

// Get progress to next level
export const getLevelProgress = (points) => {
  const currentLevel = getUserLevel(points);
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === currentLevel.level + 1);
  
  if (!nextLevel) {
    return {
      current: points,
      required: currentLevel.minPoints,
      percentage: 100,
      pointsToNext: 0,
      isMaxLevel: true
    };
  }
  
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsRequiredForNext = nextLevel.minPoints - currentLevel.minPoints;
  const percentage = Math.min(100, (pointsInCurrentLevel / pointsRequiredForNext) * 100);
  const pointsToNext = nextLevel.minPoints - points;
  
  return {
    current: points,
    required: nextLevel.minPoints,
    percentage: Math.round(percentage),
    pointsToNext,
    isMaxLevel: false,
    nextLevel
  };
};

// Get level badge emoji
export const getLevelBadge = (level) => {
  const badges = {
    1: '🌱',
    2: '⭐',
    3: '💎',
    4: '🏆',
    5: '👑',
    6: '🌟',
    7: '🔥',
    8: '⚡',
    9: '🚀',
    10: '👑'
  };
  return badges[level] || '⭐';
};

// Calculate points from activities
export const calculatePoints = (activities) => {
  const pointsMap = {
    eventAttendance: 50,
    taskCompleted: 30,
    taskApproved: 30,
    eventCreated: 20,
    profileCompleted: 10,
    firstLogin: 5
  };
  
  let totalPoints = 0;
  
  if (activities.events) totalPoints += activities.events * pointsMap.eventAttendance;
  if (activities.tasks) totalPoints += activities.tasks * pointsMap.taskCompleted;
  if (activities.approved) totalPoints += activities.approved * pointsMap.taskApproved;
  
  return totalPoints;
};

// Get all levels for display
export const getAllLevels = () => {
  return LEVEL_THRESHOLDS;
};

// Get rank suffix (1st, 2nd, 3rd, etc.)
export const getRankSuffix = (rank) => {
  if (rank === 1) return 'الأول';
  if (rank === 2) return 'الثاني';
  if (rank === 3) return 'الثالث';
  return `الـ ${rank}`;
};
