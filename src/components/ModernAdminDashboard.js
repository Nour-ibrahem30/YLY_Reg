import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaHome, FaUsers, FaUserClock, FaCalendarAlt, FaClipboardList, 
  FaChartBar, FaQrcode, FaMoon, FaSun, FaBell, FaSignOutAlt,
  FaArrowUp, FaArrowDown, FaTrophy, FaFire, FaCheckCircle,
  FaUserPlus, FaCalendarPlus, FaMedal, FaStar, FaClock, FaBars,
  FaDesktop, FaTabletAlt, FaMobileAlt, FaEnvelope, FaSearch,
  FaMousePointer, FaUser, FaPhone, FaIdCard, FaMapMarkerAlt, FaUserTie,
  FaBuilding
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import '../styles/ModernAdminDashboard.css';

function ModernAdminDashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRegistrations: 0,
    activeEvents: 0,
    totalTasks: 0,
    completedTasks: 0,
    newUsersThisWeek: 0,
    totalPoints: 0,
    avgSessionTime: '00:00',
    bounceRate: 0,
    sessionsToday: 0
  });
  const [channelData, setChannelData] = useState([
    { name: 'Email', value: 5, color: '#fbbf24' },
    { name: 'Referral', value: 12, color: '#34d399' },
    { name: 'Organic', value: 8, color: '#818cf8' },
    { name: 'Direct', value: 6, color: '#f87171' },
    { name: 'Campaign', value: 8, color: '#60a5fa' }
  ]);
  const [deviceData, setDeviceData] = useState([
    { name: 'Desktops', value: 12843, day: -3, week: -3 },
    { name: 'Tablets', value: 6343, day: -5, week: -5 },
    { name: 'Mobiles', value: 843, day: -8, week: -8 }
  ]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setAllUsers(users);

      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const newUsers = users.filter(u => 
        u.createdAt && new Date(u.createdAt).getTime() > weekAgo
      ).length;

      const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);

      const pendingSnapshot = await getDocs(collection(db, 'pending_registrations'));

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const events = [];
      let activeEvents = 0;
      eventsSnapshot.forEach(doc => {
        const eventData = { id: doc.id, ...doc.data() };
        events.push(eventData);
        if (eventData.status === 'active') activeEvents++;
      });
      setAllEvents(events);

      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = [];
      let completedTasks = 0;
      tasksSnapshot.forEach(doc => {
        const taskData = { id: doc.id, ...doc.data() };
        tasks.push(taskData);
        if (taskData.status === 'completed') completedTasks++;
      });
      setAllTasks(tasks);

      // Calculate analytics data
      const sessionsToday = Math.floor(users.length * 0.6); // Mock: 60% of users active today
      const avgMinutes = Math.floor(Math.random() * 30) + 10;
      const avgSessionTime = `00:${avgMinutes < 10 ? '0' : ''}${avgMinutes}`;
      const bounceRate = Math.floor(Math.random() * 20) + 15; // 15-35%

      setStats({
        totalUsers: users.length,
        pendingRegistrations: pendingSnapshot.size,
        activeEvents: activeEvents,
        totalTasks: tasksSnapshot.size,
        completedTasks: completedTasks,
        newUsersThisWeek: newUsers,
        totalPoints: totalPoints,
        avgSessionTime: avgSessionTime,
        bounceRate: bounceRate,
        sessionsToday: sessionsToday
      });

      // Get top performers
      const sortedUsers = users
        .filter(u => u.points > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 5);
      setTopPerformers(sortedUsers);

      // Generate recent activity from real data
      const activities = [];
      
      // Add pending registrations
      if (pendingSnapshot.size > 0) {
        activities.push({
          type: 'pending',
          text: `${pendingSnapshot.size} طلب تسجيل جديد في انتظار الموافقة`,
          time: 'الآن',
          icon: 'FaUserClock',
          link: '/admin/pending'
        });
      }

      // Add new users this week
      if (newUsers > 0) {
        activities.push({
          type: 'user',
          text: `${newUsers} مستخدم جديد انضم هذا الأسبوع`,
          time: 'هذا الأسبوع',
          icon: 'FaUserPlus',
          link: '/admin/governorates'
        });
      }

      // Add active events
      if (activeEvents > 0) {
        activities.push({
          type: 'event',
          text: `${activeEvents} فعالية نشطة حالياً`,
          time: 'اليوم',
          icon: 'FaCalendarAlt',
          link: '/admin/events'
        });
      }

      // Add completed tasks
      if (completedTasks > 0) {
        activities.push({
          type: 'task',
          text: `تم إكمال ${completedTasks} مهمة من أصل ${tasksSnapshot.size}`,
          time: 'هذا الشهر',
          icon: 'FaCheckCircle',
          link: '/admin/tasks'
        });
      }

      setRecentActivity(activities);

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

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const searchLower = query.toLowerCase();

    // Search users
    allUsers.forEach(user => {
      if (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.governorate?.toLowerCase().includes(searchLower) ||
        user.committee?.toLowerCase().includes(searchLower) ||
        user.userId?.toLowerCase().includes(searchLower) || // البحث بالرقم القومي
        user.number?.includes(query) // البحث برقم الهاتف
      ) {
        results.push({
          type: 'user',
          icon: 'FaUser',
          title: user.name,
          subtitle: `${user.governorate} - ${user.committee} | ${user.userId || 'لا يوجد رقم قومي'}`,
          link: '/admin/governorates',
          data: user
        });
      }
    });

    // Search events
    allEvents.forEach(event => {
      if (
        event.name?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      ) {
        results.push({
          type: 'event',
          icon: 'FaCalendarAlt',
          title: event.name,
          subtitle: event.location || 'فعالية',
          link: '/admin/events',
          data: event
        });
      }
    });

    // Search tasks
    allTasks.forEach(task => {
      if (
        task.userName?.toLowerCase().includes(searchLower) ||
        task.fileName?.toLowerCase().includes(searchLower) ||
        task.userGovernorate?.toLowerCase().includes(searchLower) ||
        task.userId?.toLowerCase().includes(searchLower) // البحث بالرقم القومي في المهام
      ) {
        results.push({
          type: 'task',
          icon: 'FaClipboardList',
          title: task.fileName || 'مهمة',
          subtitle: `${task.userName} - ${task.userGovernorate}`,
          link: '/admin/tasks',
          data: task
        });
      }
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
  };

  const handleSearchResultClick = (result) => {
    if (result.type === 'user') {
      setSelectedUser(result.data);
      setShowUserModal(true);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      navigate(result.link);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar isAdmin={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      
      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <div>
              <h1>لوحة التحكم</h1>
              <p className="breadcrumb">
                <span>الرئيسية</span> / <span>الإحصائيات</span>
              </p>
            </div>
          </div>
          <div className="top-bar-right">
            <button className="date-picker-btn">
              <FaCalendarAlt />
              <span>اليوم: {new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </button>
            <button 
              className="icon-btn" 
              onClick={toggleDarkMode}
              title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button 
              className="icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="بحث"
            >
              <FaSearch />
            </button>
            <button 
              className="icon-btn"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="الإشعارات"
            >
              <FaBell />
              {stats.pendingRegistrations > 0 && (
                <span className="notification-dot"></span>
              )}
            </button>
            <div className="user-avatar" title="الملف الشخصي">
              <img src="/images/yly-logo.jpg" alt="Admin" />
            </div>
          </div>
        </header>

        {/* Search Modal */}
        {searchOpen && (
          <motion.div 
            className="search-modal"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="search-container">
              <FaSearch />
              <input 
                type="text" 
                placeholder="ابحث عن مستخدمين (الاسم، الرقم القومي، الهاتف)، فعاليات، مهام..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              <button onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}>✕</button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <motion.div 
                className="search-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {searchResults.map((result, index) => (
                  <motion.div
                    key={index}
                    className={`search-result-item ${result.type}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="search-result-icon">
                      {result.icon === 'FaUser' && <FaUsers />}
                      {result.icon === 'FaCalendarAlt' && <FaCalendarAlt />}
                      {result.icon === 'FaClipboardList' && <FaClipboardList />}
                    </div>
                    <div className="search-result-content">
                      <p className="search-result-title">{result.title}</p>
                      <span className="search-result-subtitle">{result.subtitle}</span>
                    </div>
                    <div className="search-result-arrow">←</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {searchQuery && searchResults.length === 0 && (
              <div className="search-no-results">
                <FaSearch style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '12px' }} />
                <p>لا توجد نتائج للبحث عن "{searchQuery}"</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Notifications Dropdown */}
        {notificationsOpen && (
          <motion.div 
            className="notifications-dropdown"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="notifications-header">
              <h3>الإشعارات</h3>
              <button onClick={() => setNotificationsOpen(false)}>✕</button>
            </div>
            <div className="notifications-list">
              {stats.pendingRegistrations > 0 && (
                <div className="notification-item">
                  <div className="notification-icon pending">
                    <FaUserClock />
                  </div>
                  <div className="notification-content">
                    <p>لديك {stats.pendingRegistrations} طلب تسجيل معلق</p>
                    <span>منذ دقائق</span>
                  </div>
                </div>
              )}
              <div className="notification-item">
                <div className="notification-icon success">
                  <FaCheckCircle />
                </div>
                <div className="notification-content">
                  <p>تم إكمال {stats.completedTasks} مهمة</p>
                  <span>منذ ساعة</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon info">
                  <FaCalendarAlt />
                </div>
                <div className="notification-content">
                  <p>{stats.activeEvents} فعالية نشطة حالياً</p>
                  <span>اليوم</span>
                </div>
              </div>
            </div>
            <Link to="/admin/pending" className="view-all-notifications" onClick={() => setNotificationsOpen(false)}>
              عرض جميع الإشعارات
            </Link>
          </motion.div>
        )}

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
          >
            <motion.div 
              className="user-details-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>تفاصيل المستخدم</h2>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="user-avatar-large">
                  {selectedUser.profilePhotoURL ? (
                    <img src={selectedUser.profilePhotoURL} alt={selectedUser.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                </div>
                
                <div className="user-info-grid">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <span className="info-label">الاسم</span>
                      <p className="info-value">{selectedUser.name}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <span className="info-label">البريد الإلكتروني</span>
                      <p className="info-value">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <div>
                      <span className="info-label">رقم الهاتف</span>
                      <p className="info-value">{selectedUser.number}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaIdCard className="info-icon" />
                    <div>
                      <span className="info-label">الرقم القومي</span>
                      <p className="info-value">{selectedUser.userId}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <div>
                      <span className="info-label">المحافظة</span>
                      <p className="info-value">{selectedUser.governorate}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaUsers className="info-icon" />
                    <div>
                      <span className="info-label">اللجنة</span>
                      <p className="info-value">{selectedUser.committee}</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaTrophy className="info-icon" />
                    <div>
                      <span className="info-label">النقاط</span>
                      <p className="info-value">{selectedUser.points || 0} نقطة</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaUserTie className="info-icon" />
                    <div>
                      <span className="info-label">الدور</span>
                      <p className="info-value">{selectedUser.role || 'عضو'}</p>
                    </div>
                  </div>
                </div>
                
                {selectedUser.idCardPhotoURL && (
                  <div className="id-card-section">
                    <h3>صورة البطاقة</h3>
                    <img 
                      src={selectedUser.idCardPhotoURL} 
                      alt="ID Card" 
                      className="id-card-image"
                      onClick={() => window.open(selectedUser.idCardPhotoURL, '_blank')}
                    />
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    navigate('/admin/governorates');
                    setShowUserModal(false);
                  }}
                >
                  <FaUsers /> عرض المحافظات
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowUserModal(false)}
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="stats-container">
          <motion.div 
            className="stat-card sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-content">
              <div className="stat-label">إجمالي المستخدمين</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-change positive">
                <FaArrowUp />
                <span>+{stats.newUsersThisWeek} مستخدم هذا الأسبوع</span>
              </div>
            </div>
            <div className="stat-icon-circle">
              <FaUsers />
            </div>
          </motion.div>

          <motion.div 
            className="stat-card avg-sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-content">
              <div className="stat-label">طلبات التسجيل</div>
              <div className="stat-value">{stats.pendingRegistrations}</div>
              <div className="stat-change positive">
                <FaUserClock />
                <span>في انتظار الموافقة</span>
              </div>
            </div>
            <div className="stat-icon-circle">
              <FaUserClock />
            </div>
          </motion.div>

          <motion.div 
            className="stat-card bounce-rate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-content">
              <div className="stat-label">المهام المكتملة</div>
              <div className="stat-value">{stats.completedTasks}/{stats.totalTasks}</div>
              <div className="stat-change positive">
                <FaCheckCircle />
                <span>{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% معدل الإنجاز</span>
              </div>
            </div>
            <div className="stat-icon-circle">
              <FaClipboardList />
            </div>
          </motion.div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          {/* Top Performers */}
          <motion.div 
            className="analytics-card sessions-channel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>أفضل الأعضاء</h3>
            <div className="channel-bars">
              {topPerformers.length > 0 ? (
                topPerformers.map((user, index) => {
                  const maxPoints = topPerformers[0]?.points || 1;
                  const percentage = Math.round((user.points / maxPoints) * 100);
                  const colors = ['#5b6ee1', '#34d399', '#fbbf24', '#f87171', '#818cf8'];
                  
                  return (
                    <div key={index} className="channel-item">
                      <div className="channel-info">
                        <div className="channel-dot" style={{ background: colors[index] }}></div>
                        <span className="channel-name">{user.name}</span>
                      </div>
                      <div className="channel-bar-container">
                        <motion.div 
                          className="channel-bar"
                          style={{ background: colors[index] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        >
                          <span className="channel-percentage">{user.points} نقطة</span>
                        </motion.div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FaTrophy style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }} />
                  <p>لا يوجد أعضاء بنقاط حتى الآن</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tasks Progress */}
          <motion.div 
            className="analytics-card sessions-device"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card-header">
              <h3>تقدم المهام</h3>
              <Link to="/admin/tasks" className="filter-select" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                عرض الكل
              </Link>
            </div>
            
            <div className="device-circle">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#2d3748"
                  strokeWidth="20"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="20"
                  strokeDasharray="502"
                  strokeDashoffset={502 - (502 * (stats.totalTasks > 0 ? stats.completedTasks / stats.totalTasks : 0))}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 502 }}
                  animate={{ strokeDashoffset: 502 - (502 * (stats.totalTasks > 0 ? stats.completedTasks / stats.totalTasks : 0)) }}
                  transition={{ delay: 0.6, duration: 1.5 }}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="95" textAnchor="middle" fill="white" fontSize="48" fontWeight="bold">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </text>
                <text x="100" y="120" textAnchor="middle" fill="#94a3b8" fontSize="16">مكتملة</text>
              </svg>
            </div>

            <div className="device-stats">
              <div className="device-header">
                <span>الحالة</span>
                <span>العدد</span>
                <span>النسبة</span>
              </div>
              <div className="device-row">
                <div className="device-name">
                  <FaCheckCircle style={{ color: '#34d399' }} />
                  <span>مكتملة</span>
                </div>
                <span className="device-value">{stats.completedTasks}</span>
                <span className="device-value" style={{ color: '#34d399' }}>
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </span>
              </div>
              <div className="device-row">
                <div className="device-name">
                  <FaClock style={{ color: '#fbbf24' }} />
                  <span>قيد التنفيذ</span>
                </div>
                <span className="device-value">{stats.totalTasks - stats.completedTasks}</span>
                <span className="device-value" style={{ color: '#fbbf24' }}>
                  {stats.totalTasks > 0 ? Math.round(((stats.totalTasks - stats.completedTasks) / stats.totalTasks) * 100) : 0}%
                </span>
              </div>
              <div className="device-row">
                <div className="device-name">
                  <FaClipboardList style={{ color: '#5b6ee1' }} />
                  <span>الإجمالي</span>
                </div>
                <span className="device-value">{stats.totalTasks}</span>
                <span className="device-value" style={{ color: '#5b6ee1' }}>100%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity - Enhanced */}
        <motion.div 
          className="recent-activity-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="section-header-modern">
            <div className="header-left">
              <FaClock />
              <h2>النشاط الأخير</h2>
            </div>
            <Link to="/admin/pending" className="view-all-link">
              عرض الكل ←
            </Link>
          </div>
          
          <div className="activity-grid">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div 
                  key={index}
                  className={`activity-card ${activity.type}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  onClick={() => activity.link && navigate(activity.link)}
                  style={{ cursor: activity.link ? 'pointer' : 'default' }}
                >
                  <div className="activity-icon-wrapper">
                    {activity.icon === 'FaUserPlus' && <FaUserPlus />}
                    {activity.icon === 'FaCalendarAlt' && <FaCalendarAlt />}
                    {activity.icon === 'FaCheckCircle' && <FaCheckCircle />}
                    {activity.icon === 'FaUserClock' && <FaUserClock />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-text">{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                  <div className="activity-arrow">←</div>
                </motion.div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px', 
                color: '#94a3b8' 
              }}>
                <FaClock style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }} />
                <p>لا توجد أنشطة حديثة</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="quick-stats-grid">
          <motion.div 
            className="quick-stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="quick-stat-icon trophy">
              <FaTrophy />
            </div>
            <div className="quick-stat-content">
              <h4>{stats.totalPoints.toLocaleString()}</h4>
              <p>إجمالي النقاط</p>
              <span className="quick-stat-detail">
                <FaFire /> {stats.totalUsers > 0 ? Math.round(stats.totalPoints / stats.totalUsers) : 0} متوسط/مستخدم
              </span>
            </div>
          </motion.div>

          <motion.div 
            className="quick-stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="quick-stat-icon users">
              <FaUsers />
            </div>
            <div className="quick-stat-content">
              <h4>{stats.totalUsers}</h4>
              <p>إجمالي الأعضاء</p>
              <Link to="/admin/governorates" className="quick-stat-detail action">
                عرض المحافظات ←
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="quick-stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
          >
            <div className="quick-stat-icon events">
              <FaCalendarAlt />
            </div>
            <div className="quick-stat-content">
              <h4>{stats.activeEvents}</h4>
              <p>الفعاليات النشطة</p>
              <Link to="/admin/events" className="quick-stat-detail action">
                إدارة الفعاليات ←
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default ModernAdminDashboard;
