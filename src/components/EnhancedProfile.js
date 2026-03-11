import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, 
  FaArrowLeft, FaShieldAlt, FaTrophy, FaTasks, FaCalendar,
  FaStar, FaCrown, FaChartLine, FaQrcode, FaBell, FaCog, FaMoon, FaSun,
  FaMedal, FaFire, FaAward, FaChartBar, FaCheckCircle, FaClock,
  FaUserFriends, FaGraduationCap, FaRocket
} from 'react-icons/fa';
import { getUserLevel, getLevelProgress, getLevelBadge } from '../utils/levelSystem';
import { useTheme } from '../context/ThemeContext';
import UserEvents from './UserEvents';
import UserTasks from './UserTasks';
import '../styles/EnhancedProfile.css';

function EnhancedProfile() {
  const { governorate, id } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ events: 0, tasks: 0, points: 0, completedTasks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          const userPoints = data.points || 0;
          
          // Fetch events
          const eventsQuery = query(
            collection(db, 'attendance'),
            where('userId', '==', data.userId)
          );
          const eventsSnap = await getDocs(eventsQuery);
          
          // Fetch tasks
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', data.userId)
          );
          const tasksSnap = await getDocs(tasksQuery);
          
          let completedCount = 0;
          const activities = [];
          
          tasksSnap.forEach((doc) => {
            const taskData = doc.data();
            if (taskData.status === 'approved') {
              completedCount++;
            }
            activities.push({
              type: 'task',
              title: taskData.fileName || 'مهمة',
              status: taskData.status,
              date: taskData.uploadedAt || taskData.createdAt
            });
          });
          
          eventsSnap.forEach((doc) => {
            const eventData = doc.data();
            activities.push({
              type: 'event',
              title: eventData.eventName || 'فعالية',
              date: eventData.timestamp
            });
          });
          
          // Sort by date
          activities.sort((a, b) => new Date(b.date) - new Date(a.date));
          setRecentActivities(activities.slice(0, 5));
          
          setStats({
            events: eventsSnap.size,
            tasks: tasksSnap.size,
            points: userPoints,
            completedTasks: completedCount
          });
        } else {
          setError('لم يتم العثور على البيانات');
        }
      } catch (err) {
        console.error('Error fetching document: ', err);
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={`enhanced-profile-loading ${darkMode ? 'dark' : ''}`}>
        <div className="loading-spinner-modern"></div>
        <p>جاري تحميل البروفايل...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className={`enhanced-profile-error ${darkMode ? 'dark' : ''}`}>
        <div className="error-content">
          <h2>{error || 'لم يتم العثور على البيانات'}</h2>
          <button onClick={() => navigate('/')} className="btn-primary-modern">
            <FaArrowLeft /> العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const userLevel = getUserLevel(stats.points);
  const levelProgress = getLevelProgress(stats.points);
  const levelBadge = getLevelBadge(userLevel.level);
  const completionRate = stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0;

  const tabs = [
    { id: 'dashboard', label: 'نظرة عامة', icon: FaChartLine },
    { id: 'events', label: 'الفعاليات', icon: FaCalendar },
    { id: 'tasks', label: 'المهام', icon: FaTasks },
    { id: 'profile', label: 'المعلومات', icon: FaUser }
  ];

  return (
    <div className={`enhanced-profile-modern ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <motion.div 
        className="profile-top-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button onClick={() => navigate(-1)} className="btn-back-modern">
          <FaArrowLeft />
          <span>رجوع</span>
        </button>
        
        <div className="top-nav-actions">
          <button onClick={toggleDarkMode} className="btn-icon-modern">
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <Link to={`/security-settings/${userData.userId}`} className="btn-icon-modern">
            <FaShieldAlt />
          </Link>
          <Link to={`/qr-code/${governorate}/${id}`} className="btn-icon-modern">
            <FaQrcode />
          </Link>
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div 
        className="profile-header-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="profile-header-bg">
          <div className="bg-gradient"></div>
          <div className="bg-pattern"></div>
        </div>

        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-ring" style={{ borderColor: userLevel.color }}></div>
              <div className="profile-avatar-large">
                {userData.profilePhotoURL ? (
                  <img src={userData.profilePhotoURL} alt={userData.name} />
                ) : (
                  <span className="avatar-initials-large">{getInitials(userData.name)}</span>
                )}
              </div>
              <div className="level-badge-modern" style={{ background: userLevel.color }}>
                <span className="level-emoji">{levelBadge}</span>
                <span className="level-number">{userLevel.level}</span>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <h1 className="profile-name-modern">{userData.name}</h1>
            <p className="profile-role">{userData.committee}</p>
            <div className="profile-meta">
              <span className="meta-item">
                <FaMapMarkerAlt />
                {userData.governorate}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-item">
                <FaUsers />
                {userData.committee}
              </span>
            </div>

            <div className="profile-level-card">
              <div className="level-info">
                <span className="level-title-modern">{userLevel.title}</span>
                <span className="level-points-modern">
                  <FaStar /> {stats.points} نقطة
                </span>
              </div>
              
              {!levelProgress.isMaxLevel && (
                <div className="level-progress-modern">
                  <div className="progress-info">
                    <span className="progress-label">التقدم للمستوى التالي</span>
                    <span className="progress-percentage">{levelProgress.percentage}%</span>
                  </div>
                  <div className="progress-bar-modern">
                    <motion.div 
                      className="progress-fill-modern"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress.percentage}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      style={{ background: userLevel.color }}
                    />
                  </div>
                  <div className="progress-details">
                    <span>{levelProgress.pointsToNext} نقطة متبقية</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        className="tabs-container-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="tabs-nav-modern">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn-modern ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="tab-content-modern"
        >
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid">
              {/* Stats Cards with Enhanced Design */}
              <div className="stats-cards-grid">
                <motion.div 
                  className="stat-card-modern stat-events"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="stat-card-bg"></div>
                  <div className="stat-icon-modern">
                    <FaCalendar />
                  </div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        {stats.events}
                      </motion.span>
                    </div>
                    <div className="stat-label-modern">فعالية مشاركة</div>
                    <div className="stat-subtitle">حضور وتفاعل</div>
                  </div>
                  <div className="stat-trend positive">
                    <FaChartLine />
                    <span>نشط</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card-modern stat-tasks"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="stat-card-bg"></div>
                  <div className="stat-icon-modern">
                    <FaTasks />
                  </div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        {stats.tasks}
                      </motion.span>
                    </div>
                    <div className="stat-label-modern">مهمة مرفوعة</div>
                    <div className="stat-subtitle">{stats.completedTasks} مكتملة</div>
                  </div>
                  <div className="stat-trend positive">
                    <FaCheckCircle />
                    <span>{completionRate}%</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card-modern stat-points"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="stat-card-bg"></div>
                  <div className="stat-icon-modern">
                    <FaTrophy />
                  </div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        {stats.points}
                      </motion.span>
                    </div>
                    <div className="stat-label-modern">نقطة إجمالية</div>
                    <div className="stat-subtitle">رصيدك الحالي</div>
                  </div>
                  <div className="stat-trend fire">
                    <FaFire />
                    <span>متميز</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card-modern stat-level"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="stat-card-bg"></div>
                  <div className="stat-icon-modern">
                    <FaCrown />
                  </div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern">
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        {userLevel.level}
                      </motion.span>
                    </div>
                    <div className="stat-label-modern">{userLevel.title}</div>
                    <div className="stat-subtitle">{levelBadge} مستواك</div>
                  </div>
                  <div className="stat-trend rocket">
                    <FaRocket />
                    <span>تقدم</span>
                  </div>
                </motion.div>
              </div>

              {/* Performance Card - Enhanced */}
              <motion.div 
                className="performance-card-enhanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="performance-header">
                  <div className="header-left">
                    <FaChartBar />
                    <h3>الأداء والإنجازات</h3>
                  </div>
                  <div className="performance-badge">
                    <FaStar />
                    <span>ممتاز</span>
                  </div>
                </div>
                
                <div className="performance-stats-enhanced">
                  <motion.div 
                    className="performance-item-enhanced"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="performance-circle-enhanced" style={{ '--progress': `${completionRate}%`, '--color': '#34d399' }}>
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="circle-bg" />
                        <motion.circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          className="circle-progress"
                          style={{ 
                            stroke: '#34d399',
                            strokeDasharray: `${completionRate * 2.827}, 282.7`
                          }}
                          initial={{ strokeDasharray: '0, 282.7' }}
                          animate={{ strokeDasharray: `${completionRate * 2.827}, 282.7` }}
                          transition={{ duration: 1.5, delay: 1 }}
                        />
                      </svg>
                      <div className="circle-content">
                        <span className="circle-value">{completionRate}%</span>
                        <span className="circle-label">إنجاز</span>
                      </div>
                    </div>
                    <div className="performance-info">
                      <h4>معدل إنجاز المهام</h4>
                      <p>{stats.completedTasks} من {stats.tasks} مهمة</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="performance-item-enhanced"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="performance-circle-enhanced" style={{ '--progress': `${levelProgress.percentage}%`, '--color': '#5b6ee1' }}>
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="circle-bg" />
                        <motion.circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          className="circle-progress"
                          style={{ 
                            stroke: '#5b6ee1',
                            strokeDasharray: `${levelProgress.percentage * 2.827}, 282.7`
                          }}
                          initial={{ strokeDasharray: '0, 282.7' }}
                          animate={{ strokeDasharray: `${levelProgress.percentage * 2.827}, 282.7` }}
                          transition={{ duration: 1.5, delay: 1.2 }}
                        />
                      </svg>
                      <div className="circle-content">
                        <span className="circle-value">{levelProgress.percentage}%</span>
                        <span className="circle-label">تقدم</span>
                      </div>
                    </div>
                    <div className="performance-info">
                      <h4>التقدم للمستوى التالي</h4>
                      <p>{levelProgress.pointsToNext} نقطة متبقية</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="performance-item-enhanced achievements"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <div className="achievement-icon">
                      <FaMedal />
                    </div>
                    <div className="achievement-content">
                      <div className="achievement-number">{stats.completedTasks}</div>
                      <h4>مهام مكتملة</h4>
                      <div className="achievement-badges">
                        <span className="badge-item">
                          <FaAward />
                          متميز
                        </span>
                        <span className="badge-item">
                          <FaFire />
                          نشط
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div 
                className="recent-activity-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3>
                  <FaClock />
                  النشاط الأخير
                </h3>
                <div className="activity-list">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className={`activity-icon ${activity.type}`}>
                          {activity.type === 'event' ? <FaCalendar /> : <FaTasks />}
                        </div>
                        <div className="activity-content">
                          <p className="activity-title">{activity.title}</p>
                          <span className="activity-date">
                            {new Date(activity.date).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        {activity.status && (
                          <span className={`activity-status ${activity.status}`}>
                            {activity.status === 'approved' ? 'مقبولة' : 
                             activity.status === 'pending' ? 'قيد المراجعة' : 'مرفوضة'}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-activity">
                      <FaClock />
                      <p>لا يوجد نشاط حديث</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                className="quick-actions-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <h3>إجراءات سريعة</h3>
                <div className="actions-grid-modern">
                  <Link to={`/qr-code/${governorate}/${id}`} className="action-card">
                    <div className="action-icon qr">
                      <FaQrcode />
                    </div>
                    <span>QR Code</span>
                  </Link>
                  <Link to={`/security-settings/${userData.userId}`} className="action-card">
                    <div className="action-icon security">
                      <FaShieldAlt />
                    </div>
                    <span>الأمان</span>
                  </Link>
                  <button onClick={() => setActiveTab('events')} className="action-card">
                    <div className="action-icon events">
                      <FaCalendar />
                    </div>
                    <span>الفعاليات</span>
                  </button>
                  <button onClick={() => setActiveTab('tasks')} className="action-card">
                    <div className="action-icon tasks">
                      <FaTasks />
                    </div>
                    <span>المهام</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="events-content-modern">
              {userData && userData.userId ? (
                <UserEvents userId={userData.userId} />
              ) : (
                <div className="no-data-message">
                  <FaCalendar />
                  <p>لم يتم العثور على معرف المستخدم</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tasks-content-modern">
              {userData && userData.userId ? (
                <UserTasks userId={userData.userId} userInfo={userData} />
              ) : (
                <div className="no-data-message">
                  <FaTasks />
                  <p>لم يتم العثور على معرف المستخدم</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-details-modern">
              <motion.div 
                className="details-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>المعلومات الشخصية</h3>
                <div className="details-grid-modern">
                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaUser />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">الاسم الكامل</span>
                      <span className="detail-value-modern">{userData.name}</span>
                    </div>
                  </div>

                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaEnvelope />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">البريد الإلكتروني</span>
                      <span className="detail-value-modern">{userData.email}</span>
                    </div>
                  </div>

                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaPhone />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">رقم الهاتف</span>
                      <span className="detail-value-modern">{userData.number}</span>
                    </div>
                  </div>

                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaIdCard />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">الرقم القومي</span>
                      <span className="detail-value-modern">{userData.userId}</span>
                    </div>
                  </div>

                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">المحافظة</span>
                      <span className="detail-value-modern">{userData.governorate}</span>
                    </div>
                  </div>

                  <div className="detail-item-modern">
                    <div className="detail-icon-modern">
                      <FaUsers />
                    </div>
                    <div className="detail-content-modern">
                      <span className="detail-label-modern">اللجنة</span>
                      <span className="detail-value-modern">{userData.committee}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default EnhancedProfile;
