import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaUserClock, FaCalendarAlt, FaClipboardList, 
  FaChartBar, FaQrcode, FaMoon, FaSun, FaMapMarkerAlt,
  FaArrowUp, FaTrophy, FaFire, FaBell, FaSignOutAlt
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/NewAdminDashboard.css';

function NewAdminDashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRegistrations: 0,
    activeEvents: 0,
    totalTasks: 0,
    newUsersThisWeek: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Calculate new users this week
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const newUsers = users.filter(u => 
        u.createdAt && new Date(u.createdAt).getTime() > weekAgo
      ).length;

      // Calculate total points
      const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);

      // Fetch pending
      const pendingSnapshot = await getDocs(collection(db, 'pending_registrations'));

      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      let activeEvents = 0;
      eventsSnapshot.forEach(doc => {
        if (doc.data().status === 'active') activeEvents++;
      });

      // Fetch tasks
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));

      setStats({
        totalUsers: users.length,
        pendingRegistrations: pendingSnapshot.size,
        activeEvents: activeEvents,
        totalTasks: tasksSnapshot.size,
        newUsersThisWeek: newUsers,
        totalPoints: totalPoints
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    navigate('/');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  if (loading) {
    return (
      <div className={`new-admin-dashboard ${darkMode ? 'dark' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`new-admin-dashboard ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation Bar */}
      <motion.nav 
        className="top-nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="nav-left">
          <img src="/images/yly-logo.jpg" alt="YLY" className="nav-logo" />
          <div className="nav-title">
            <h2>YLY Admin</h2>
            <p>{currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="nav-right">
          <button className="nav-btn" onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="nav-btn notification-btn">
            <FaBell />
            {stats.pendingRegistrations > 0 && (
              <span className="notification-badge">{stats.pendingRegistrations}</span>
            )}
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Welcome Section */}
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="welcome-content">
            <h1>{getGreeting()}، Admin 👋</h1>
            <p>إليك نظرة شاملة على أداء المنصة</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="stats-grid-modern">
          <motion.div 
            className="stat-card-modern blue"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>إجمالي المستخدمين</p>
              <div className="stat-trend">
                <FaArrowUp />
                <span>+{stats.newUsersThisWeek} هذا الأسبوع</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern red"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaUserClock />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingRegistrations}</h3>
              <p>طلبات معلقة</p>
              <Link to="/admin/pending" className="stat-action">
                عرض الطلبات →
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern green"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <h3>{stats.activeEvents}</h3>
              <p>فعاليات نشطة</p>
              <Link to="/admin/events" className="stat-action">
                إدارة الفعاليات →
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern orange"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaClipboardList />
            </div>
            <div className="stat-content">
              <h3>{stats.totalTasks}</h3>
              <p>إجمالي المهام</p>
              <Link to="/admin/tasks" className="stat-action">
                عرض المهام →
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern purple"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <h3>{stats.totalPoints.toLocaleString()}</h3>
              <p>إجمالي النقاط</p>
              <div className="stat-trend">
                <FaFire />
                <span>{Math.round(stats.totalPoints / stats.totalUsers)} متوسط</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern cyan"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <div className="stat-icon-wrapper">
              <FaMapMarkerAlt />
            </div>
            <div className="stat-content">
              <h3>27</h3>
              <p>محافظة</p>
              <Link to="/admin/governorates" className="stat-action">
                عرض المحافظات →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="quick-actions-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2>إجراءات سريعة</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/governorates" className="action-card">
              <FaMapMarkerAlt />
              <span>المحافظات</span>
            </Link>
            <Link to="/admin/pending" className="action-card">
              <FaUserClock />
              <span>طلبات التسجيل</span>
            </Link>
            <Link to="/admin/events" className="action-card">
              <FaCalendarAlt />
              <span>الفعاليات</span>
            </Link>
            <Link to="/admin/tasks" className="action-card">
              <FaClipboardList />
              <span>المهام</span>
            </Link>
            <Link to="/admin/analytics" className="action-card">
              <FaChartBar />
              <span>التحليلات</span>
            </Link>
            <Link to="/admin/scanner" className="action-card">
              <FaQrcode />
              <span>مسح QR</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default NewAdminDashboard;
