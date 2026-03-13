import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaUsers, 
  FaTrophy, 
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaMapMarkerAlt,
  FaUserFriends,
  FaClipboardList,
  FaStar,
  FaMedal,
  FaChartLine,
  FaChartPie
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import '../styles/Analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalTasks: 0,
    totalEvents: 0,
    activeUsers: 0,
    pendingRegistrations: 0,
    completedTasks: 0,
    upcomingEvents: 0
  });

  const [governoratesStats, setGovernoratesStats] = useState([]);
  const [committeesStats, setCommitteesStats] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [growthData, setGrowthData] = useState({
    usersGrowth: 0,
    pointsGrowth: 0,
    tasksGrowth: 0,
    eventsGrowth: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Load tasks
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = [];
      tasksSnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });

      // Load events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const events = [];
      eventsSnapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      // Calculate stats
      const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);
      const completedTasks = tasks.filter(t => t.status === 'approved').length;
      const pendingUsers = users.filter(u => u.status === 'pending').length;
      const activeEvents = events.filter(e => e.status === 'active').length;

      setStats({
        totalUsers: users.length,
        totalPoints: totalPoints,
        totalTasks: tasks.length,
        totalEvents: events.length,
        activeUsers: users.filter(u => u.status === 'approved').length,
        pendingRegistrations: pendingUsers,
        completedTasks: completedTasks,
        upcomingEvents: activeEvents
      });

      // Governorates stats
      const govStats = {};
      users.forEach(user => {
        const gov = user.governorate || 'غير محدد';
        if (!govStats[gov]) {
          govStats[gov] = { count: 0, points: 0 };
        }
        govStats[gov].count++;
        govStats[gov].points += user.points || 0;
      });

      const govArray = Object.entries(govStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setGovernoratesStats(govArray);

      // Committees stats
      const commStats = {};
      users.forEach(user => {
        const comm = user.committee || 'غير محدد';
        if (!commStats[comm]) {
          commStats[comm] = { count: 0, points: 0 };
        }
        commStats[comm].count++;
        commStats[comm].points += user.points || 0;
      });

      const commArray = Object.entries(commStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setCommitteesStats(commArray);

      // Top users
      const topUsersArray = users
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10);
      setTopUsers(topUsersArray);

      // Mock growth data (في التطبيق الحقيقي، يتم حسابها من البيانات التاريخية)
      setGrowthData({
        usersGrowth: 12.5,
        pointsGrowth: 8.3,
        tasksGrowth: 15.7,
        eventsGrowth: 5.2
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar isAdmin={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل التحليلات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        <div className="analytics-page">
          <div className="analytics-container">
            {/* Top Bar */}
            <motion.div 
              className="analytics-topbar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button 
                className="back-btn"
                onClick={() => navigate('/admin')}
              >
                <FaArrowLeft />
                <span>العودة للوحة التحكم</span>
              </button>
            </motion.div>

            {/* Header */}
            <motion.div 
              className="analytics-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="header-icon-large">
                <FaChartBar />
              </div>
              <div>
                <h1>التحليلات والإحصائيات</h1>
                <p>نظرة شاملة على أداء المنصة والأعضاء</p>
              </div>
            </motion.div>

            {/* Main Stats Grid */}
            <div className="main-stats-grid">
              <motion.div 
                className="stat-card-analytics users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="stat-icon-wrapper">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalUsers.toLocaleString()}</h3>
                  <p>إجمالي الأعضاء</p>
                  <div className="stat-growth positive">
                    <FaArrowUp />
                    <span>{growthData.usersGrowth}%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card-analytics points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="stat-icon-wrapper">
                  <FaTrophy />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalPoints.toLocaleString()}</h3>
                  <p>إجمالي النقاط</p>
                  <div className="stat-growth positive">
                    <FaArrowUp />
                    <span>{growthData.pointsGrowth}%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card-analytics tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="stat-icon-wrapper">
                  <FaClipboardList />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalTasks.toLocaleString()}</h3>
                  <p>إجمالي المهام</p>
                  <div className="stat-growth positive">
                    <FaArrowUp />
                    <span>{growthData.tasksGrowth}%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card-analytics events"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="stat-icon-wrapper">
                  <FaCalendarAlt />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalEvents.toLocaleString()}</h3>
                  <p>إجمالي الفعاليات</p>
                  <div className="stat-growth positive">
                    <FaArrowUp />
                    <span>{growthData.eventsGrowth}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Secondary Stats */}
            <div className="secondary-stats-grid">
              <motion.div 
                className="secondary-stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="secondary-stat-icon active">
                  <FaUserFriends />
                </div>
                <div>
                  <h4>{stats.activeUsers}</h4>
                  <p>أعضاء نشطين</p>
                </div>
              </motion.div>

              <motion.div 
                className="secondary-stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="secondary-stat-icon pending">
                  <FaUsers />
                </div>
                <div>
                  <h4>{stats.pendingRegistrations}</h4>
                  <p>طلبات معلقة</p>
                </div>
              </motion.div>

              <motion.div 
                className="secondary-stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="secondary-stat-icon completed">
                  <FaClipboardList />
                </div>
                <div>
                  <h4>{stats.completedTasks}</h4>
                  <p>مهام مكتملة</p>
                </div>
              </motion.div>

              <motion.div 
                className="secondary-stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="secondary-stat-icon upcoming">
                  <FaCalendarAlt />
                </div>
                <div>
                  <h4>{stats.upcomingEvents}</h4>
                  <p>فعاليات قادمة</p>
                </div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              {/* Top Governorates */}
              <motion.div 
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="chart-header">
                  <div className="chart-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h3>أكثر المحافظات نشاطاً</h3>
                    <p>حسب عدد الأعضاء</p>
                  </div>
                </div>
                <div className="chart-content">
                  {governoratesStats.map((gov, index) => (
                    <div key={gov.name} className="bar-item">
                      <div className="bar-info">
                        <span className="bar-rank">#{index + 1}</span>
                        <span className="bar-label">{gov.name}</span>
                        <span className="bar-value">{gov.count} عضو</span>
                      </div>
                      <div className="bar-wrapper">
                        <motion.div 
                          className="bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${(gov.count / governoratesStats[0].count) * 100}%` }}
                          transition={{ delay: 1.2 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Committees */}
              <motion.div 
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <div className="chart-header">
                  <div className="chart-icon">
                    <FaUserFriends />
                  </div>
                  <div>
                    <h3>أكثر اللجان نشاطاً</h3>
                    <p>حسب عدد الأعضاء</p>
                  </div>
                </div>
                <div className="chart-content">
                  {committeesStats.map((comm, index) => (
                    <div key={comm.name} className="bar-item">
                      <div className="bar-info">
                        <span className="bar-rank">#{index + 1}</span>
                        <span className="bar-label">{comm.name}</span>
                        <span className="bar-value">{comm.count} عضو</span>
                      </div>
                      <div className="bar-wrapper">
                        <motion.div 
                          className="bar-fill committee"
                          initial={{ width: 0 }}
                          animate={{ width: `${(comm.count / committeesStats[0].count) * 100}%` }}
                          transition={{ delay: 1.3 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Top Users */}
            <motion.div 
              className="top-users-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="section-header-analytics">
                <div className="section-icon-analytics">
                  <FaMedal />
                </div>
                <div>
                  <h2>أفضل الأعضاء</h2>
                  <p>الأعضاء الأكثر تميزاً حسب النقاط</p>
                </div>
              </div>

              <div className="top-users-grid">
                {topUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    className="top-user-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + index * 0.05 }}
                  >
                    <div className="user-rank-badge">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="user-avatar">
                      {user.profilePhotoURL ? (
                        <img src={user.profilePhotoURL} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <h4>{user.name}</h4>
                    <p className="user-committee">{user.committee}</p>
                    <p className="user-governorate">{user.governorate}</p>
                    <div className="user-points">
                      <FaTrophy />
                      <span>{user.points || 0} نقطة</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
