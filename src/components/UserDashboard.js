import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaClipboardList, 
  FaTrophy,
  FaFire,
  FaChartLine,
  FaBell,
  FaArrowRight,
  FaUser,
  FaQrcode,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaShieldAlt,
  FaTimes
} from 'react-icons/fa';
import StatsCard from './StatsCard';
import { getUserLevel, getLevelProgress, getLevelBadge } from '../utils/levelSystem';
import { useTheme } from '../context/ThemeContext';
import '../styles/UserDashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    points: 0,
    eventsAttended: 0,
    tasksCompleted: 0,
    rank: 0
  });
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
          navigate('/');
          return;
        }

        const user = JSON.parse(currentUser);
        
        const userDoc = await getDoc(doc(db, 'users', user.userDocId));
        if (userDoc.exists()) {
          const fullUserData = userDoc.data();
          setUserData({ ...user, ...fullUserData });
          
          const userPoints = fullUserData.points || 0;
          
          const eventsQuery = query(
            collection(db, 'attendance'),
            where('userId', '==', fullUserData.userId)
          );
          const eventsSnap = await getDocs(eventsQuery);
          
          const tasksQuery = query(
            collection(db, 'points'),
            where('userId', '==', fullUserData.userId)
          );
          const tasksSnap = await getDocs(tasksQuery);
          
          setStats({
            points: userPoints,
            eventsAttended: eventsSnap.size,
            tasksCompleted: tasksSnap.size,
            rank: 12
          });
          
          const eventsRef = collection(db, 'events');
          const eventsSnapshot = await getDocs(eventsRef);
          const events = [];
          eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            const eventDate = new Date(eventData.date);
            if (eventDate >= new Date()) {
              events.push({
                id: doc.id,
                ...eventData
              });
            }
          });
          setUpcomingEvents(events.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    navigate('/');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown') && !event.target.closest('.notification-btn')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  if (loading) {
    return (
      <div className={`dashboard-page ${darkMode ? 'dark' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const level = getUserLevel(stats.points);
  const progress = getLevelProgress(stats.points);
  const badge = getLevelBadge(level.level);

  return (
    <div className={`dashboard-page ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="brand-logo" style={{
              padding: 0,
              overflow: 'hidden'
            }}>
              {userData.profilePhotoURL ? (
                <img 
                  src={userData.profilePhotoURL} 
                  alt={userData.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.2rem'
                }}>
                  {userData.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
            </div>
            <span className="brand-text">لوحة التحكم</span>
          </div>
          
          <div className="nav-actions">
            <button className="nav-btn" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button className="nav-btn notification-btn" onClick={toggleNotifications}>
              <FaBell />
              <span className="notification-badge">5</span>
            </button>
            <Link to={`/profile/${userData.governorate}/${userData.userDocId}`} className="nav-btn">
              <FaUser />
            </Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <motion.div
            className="notifications-dropdown"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '70px',
              left: '20px',
              background: darkMode ? '#1f2937' : 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              width: '350px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000,
              padding: '16px'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: `2px solid ${darkMode ? '#2d3748' : '#e5e7eb'}`
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: darkMode ? '#ffffff' : '#1f2937'
              }}>
                الإشعارات
              </h3>
              <button
                onClick={toggleNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: darkMode ? '#94a3b8' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Sample Notifications */}
              <div style={{
                padding: '12px',
                background: darkMode ? '#2d3748' : '#f3f4f6',
                borderRadius: '8px',
                borderRight: '4px solid #5b6ee1'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <FaCalendarAlt style={{ color: '#5b6ee1' }} />
                  <span style={{
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    فعالية جديدة
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#cbd5e1' : '#6b7280',
                  margin: 0
                }}>
                  تم إضافة فعالية جديدة: "ورشة عمل القيادة"
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  منذ ساعتين
                </span>
              </div>

              <div style={{
                padding: '12px',
                background: darkMode ? '#2d3748' : '#f3f4f6',
                borderRadius: '8px',
                borderRight: '4px solid #7c3aed'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <FaClipboardList style={{ color: '#7c3aed' }} />
                  <span style={{
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    مهمة جديدة
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#cbd5e1' : '#6b7280',
                  margin: 0
                }}>
                  تم تعيين مهمة جديدة لك: "إعداد التقرير الشهري"
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  منذ 5 ساعات
                </span>
              </div>

              <div style={{
                padding: '12px',
                background: darkMode ? '#2d3748' : '#f3f4f6',
                borderRadius: '8px',
                borderRight: '4px solid #34d399'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <FaTrophy style={{ color: '#34d399' }} />
                  <span style={{
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    إنجاز جديد
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#cbd5e1' : '#6b7280',
                  margin: 0
                }}>
                  مبروك! حصلت على 50 نقطة جديدة
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  منذ يوم واحد
                </span>
              </div>

              <div style={{
                padding: '12px',
                background: darkMode ? '#2d3748' : '#f3f4f6',
                borderRadius: '8px',
                borderRight: '4px solid #fbbf24'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <FaFire style={{ color: '#fbbf24' }} />
                  <span style={{
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    تذكير
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#cbd5e1' : '#6b7280',
                  margin: 0
                }}>
                  لديك فعالية غداً: "اجتماع اللجنة الشهري"
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  منذ يومين
                </span>
              </div>

              <div style={{
                padding: '12px',
                background: darkMode ? '#2d3748' : '#f3f4f6',
                borderRadius: '8px',
                borderRight: '4px solid #818cf8'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <FaChartLine style={{ color: '#818cf8' }} />
                  <span style={{
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    تحديث
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9rem',
                  color: darkMode ? '#cbd5e1' : '#6b7280',
                  margin: 0
                }}>
                  تم تحديث ترتيبك في لوحة المتصدرين
                </p>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  منذ 3 أيام
                </span>
              </div>
            </div>

            <button
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                background: 'linear-gradient(135deg, #5b6ee1 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(91, 110, 225, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              onClick={() => {
                setShowNotifications(false);
                alert('سيتم إضافة صفحة الإشعارات الكاملة قريباً');
              }}
            >
              عرض جميع الإشعارات
            </button>
          </motion.div>
        )}
      </nav>

      <div className="dashboard-container">
        {/* Header */}
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>مرحباً، {userData.name}! 👋</h1>
            <p>إليك ملخص نشاطك اليوم</p>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div 
          className="level-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="level-card-content">
            <div className="level-badge-large">
              {badge}
            </div>
            <div className="level-info">
              <div className="level-title">
                المستوى {level.level} - {level.title}
              </div>
              <div className="level-points">
                {userData.points || 0} نقطة
              </div>
            </div>
          </div>
          
          <div className="level-progress-section">
            <div className="progress-info">
              <span>التقدم للمستوى التالي</span>
              {!progress.isMaxLevel && (
                <span className="points-remaining">
                  {progress.pointsToNext} نقطة متبقية
                </span>
              )}
            </div>
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ delay: 0.5, duration: 1 }}
                style={{ background: level.color }}
              />
            </div>
            <div className="progress-percentage">{progress.percentage}%</div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard
            icon={FaCalendarAlt}
            title="الفعاليات"
            value={stats.eventsAttended}
            subtitle="فعالية حضرتها"
            trend="up"
            trendValue="+2 هذا الشهر"
            color="primary"
            delay={0.2}
          />
          
          <StatsCard
            icon={FaClipboardList}
            title="المهام"
            value={stats.tasksCompleted}
            subtitle="مهمة مكتملة"
            trend="up"
            trendValue="+3 هذا الأسبوع"
            color="success"
            delay={0.3}
          />
          
          <StatsCard
            icon={FaTrophy}
            title="الترتيب"
            value={`#${stats.rank}`}
            subtitle="من بين الأعضاء"
            trend="up"
            trendValue="+5 مراكز"
            color="warning"
            delay={0.4}
          />
          
          <StatsCard
            icon={FaFire}
            title="النقاط"
            value={stats.points}
            subtitle="إجمالي النقاط"
            trend="up"
            trendValue="+50 هذا الشهر"
            color="accent"
            delay={0.5}
          />
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2>إجراءات سريعة</h2>
          <div className="actions-grid">
            <Link to={`/profile/${userData.governorate}/${userData.userDocId}`} className="action-card">
              <FaUser />
              <span>البروفايل</span>
            </Link>
            
            <Link to={`/qr-code/${userData.governorate}/${userData.userDocId}`} className="action-card">
              <FaQrcode />
              <span>QR Code</span>
            </Link>
            
            <Link to={`/security-settings/${userData.userId}`} className="action-card">
              <FaShieldAlt />
              <span>إعدادات الأمان</span>
            </Link>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Upcoming Events */}
          <motion.div 
            className="content-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="content-card-header">
              <h3>
                <FaCalendarAlt /> الفعاليات القادمة
              </h3>
              <Link to={`/profile/${userData.governorate}/${userData.userDocId}`} className="view-all">
                عرض الكل <FaArrowRight />
              </Link>
            </div>
            
            <div className="events-list">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    className="event-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="event-date">
                      <div className="date-day">
                        {new Date(event.date).getDate()}
                      </div>
                      <div className="date-month">
                        {new Date(event.date).toLocaleDateString('ar-EG', { month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="event-info">
                      <div className="event-name">{event.title || event.name}</div>
                      <div className="event-time">{event.time || '---'}</div>
                    </div>
                    
                    <span className="event-status pending">عرض</span>
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#94a3b8' : '#6b7280' }}>
                  لا توجد فعاليات قادمة
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="content-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="content-card-header">
              <h3>
                <FaChartLine /> النشاط الأخير
              </h3>
            </div>
            
            <div className="activity-list">
              <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#94a3b8' : '#6b7280' }}>
                لا توجد أنشطة حديثة
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
