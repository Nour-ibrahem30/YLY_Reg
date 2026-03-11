import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { 
  FaUser, FaMapMarkerAlt, FaUsers, FaSearch, FaDownload, FaQrcode, 
  FaCalendarAlt, FaClipboardList, FaUserClock, FaTh, FaTable, 
  FaEnvelope, FaPhone, FaIdCard, FaCalendar, FaChartBar, FaMoon, FaSun 
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import UserCard from './UserCard';
import UserDetailsModal from './UserDetailsModal';
import '../styles/UserCards.css';

function AdminDashboard() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGovernorate, setFilterGovernorate] = useState('');
  const [filterCommittee, setFilterCommittee] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedUser, setSelectedUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    pendingRegistrations: 0,
    activeEvents: 0,
    totalTasks: 0
  });
  
  // Refs for GSAP animations
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const filtersRef = useRef(null);

  // Move arrays outside to prevent re-creation
  const governorates = React.useMemo(() => [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ], []);

  const committees = React.useMemo(() => ['PR', 'HR', 'R&D', 'Social Media', 'OR'], []);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = [];
      
      console.log('Fetching data from users collection and governorates...');
      
      // 1. جلب البيانات من users collection (المستخدمين المعتمدين الجدد)
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log(`Fetched ${usersSnapshot.size} users from users collection`);
        usersSnapshot.forEach((doc) => {
          users.push({
            id: doc.id,
            ...doc.data(),
            source: 'users'
          });
        });
      } catch (err) {
        console.warn('Error fetching from users collection:', err);
      }
      
      // 2. جلب البيانات من المحافظات (المستخدمين القدامى)
      for (const gov of governorates) {
        try {
          const querySnapshot = await getDocs(collection(db, gov));
          console.log(`Fetched ${querySnapshot.size} users from ${gov}`);
          querySnapshot.forEach((doc) => {
            users.push({
              id: doc.id,
              ...doc.data(),
              source: gov
            });
          });
        } catch (govError) {
          console.warn(`Error fetching from ${gov}:`, govError);
        }
      }
      
      console.log('Total users fetched:', users.length);
      setAllUsers(users);
      setFilteredUsers(users);
      
      // Fetch stats
      await fetchStats();
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('حدث خطأ في تحميل البيانات. تأكد من صلاحيات Firebase.');
    } finally {
      setLoading(false);
    }
  }, [governorates]);

  const fetchStats = async () => {
    try {
      // Fetch pending registrations
      const pendingSnapshot = await getDocs(collection(db, 'pending_registrations'));
      
      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const activeEvents = [];
      eventsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          activeEvents.push(data);
        }
      });
      
      // Fetch tasks
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      
      setDashboardStats({
        totalUsers: allUsers.length,
        pendingRegistrations: pendingSnapshot.size,
        activeEvents: activeEvents.length,
        totalTasks: tasksSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = [...allUsers];

    // فلترة بالبحث
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId?.includes(searchTerm) ||
        user.number?.includes(searchTerm)
      );
    }

    // فلترة بالمحافظة
    if (filterGovernorate) {
      filtered = filtered.filter(user => user.governorate === filterGovernorate);
    }

    // فلترة باللجنة
    if (filterCommittee) {
      filtered = filtered.filter(user => user.committee === filterCommittee);
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchTerm, filterGovernorate, filterCommittee]);

  useEffect(() => {
    // Don't fetch on mount - wait for user action or filter
    // fetchAllUsers();
    
    // GSAP entrance animations
    if (headerRef.current) {
      gsap.from(headerRef.current, {
        duration: 0.8,
        y: -50,
        opacity: 0,
        ease: 'power3.out'
      });
    }
    
    if (statsRef.current) {
      gsap.from(statsRef.current.children, {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        delay: 0.3
      });
    }
    
    if (filtersRef.current) {
      gsap.from(filtersRef.current.children, {
        duration: 0.5,
        x: -30,
        opacity: 0,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.6
      });
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const exportToCSV = () => {
    // Create CSV content with UTF-8 BOM for proper Arabic support
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الهوية', 'المحافظة', 'اللجنة', 'الدور الوظيفي', 'تاريخ التسجيل'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.number,
      user.userId,
      user.governorate,
      user.committee,
      user.role || 'غير محدد',
      new Date(user.createdAt).toLocaleDateString('ar-EG')
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob with UTF-8 BOM
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yly_members_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  };

  const getStats = () => {
    const stats = {
      total: filteredUsers.length,
      byGovernorate: {},
      byCommittee: {}
    };

    filteredUsers.forEach(user => {
      stats.byGovernorate[user.governorate] = (stats.byGovernorate[user.governorate] || 0) + 1;
      stats.byCommittee[user.committee] = (stats.byCommittee[user.committee] || 0) + 1;
    });

    return stats;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px' }}>جاري تحميل البيانات من Firebase...</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '10px' }}>قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="error-message" style={{ marginTop: '100px', padding: '30px', fontSize: '1.1rem' }}>
            <p>{error}</p>
            <button 
              onClick={fetchAllUsers} 
              style={{ 
                marginTop: '20px', 
                padding: '12px 24px', 
                background: '#0066ff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: '600'
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show initial state with load button
  if (allUsers.length === 0 && !loading && !error) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <motion.div 
            className="admin-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1>لوحة تحكم الأدمن</h1>
              <p>إدارة أعضاء YLY</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                to="/admin/analytics" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaChartBar /> التحليلات
              </Link>
              <Link 
                to="/admin/governorates" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaMapMarkerAlt /> المحافظات
              </Link>
              <Link 
                to="/admin/events" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaCalendarAlt /> إدارة الفعاليات
              </Link>
              <Link 
                to="/admin/pending" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaUserClock /> طلبات التسجيل
              </Link>
              <Link 
                to="/admin/attendance" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaClipboardList /> سجلات الحضور
              </Link>
              <Link 
                to="/admin/scanner" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 153, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaQrcode /> ماسح QR
              </Link>
              <Link 
                to="/admin/tasks" 
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #E31E24 0%, #B71C1C 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(227, 30, 36, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaClipboardList /> المهام المرفوعة
              </Link>
            </div>
          </motion.div>

          <div style={{
            textAlign: 'center',
            padding: '100px 20px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            marginTop: '40px'
          }}>
            <FaUser size={80} style={{ color: '#d1d5db', marginBottom: '30px' }} />
            <h2 style={{ color: '#001845', fontSize: '1.8rem', marginBottom: '15px' }}>
              اضغط لتحميل بيانات الأعضاء
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '1.1rem' }}>
              سيتم تحميل بيانات الأعضاء من جميع المصادر (المحافظات + المستخدمين المعتمدين)
            </p>
            <button
              onClick={fetchAllUsers}
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: '0 10px 25px rgba(0, 153, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 15px 35px rgba(0, 153, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 25px rgba(0, 153, 255, 0.3)';
              }}
            >
              <FaUser style={{ marginLeft: '10px' }} />
              تحميل بيانات الأعضاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <motion.div 
          className="admin-header"
          ref={headerRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>لوحة تحكم الأدمن</h1>
            <p>إدارة أعضاء YLY</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={toggleDarkMode}
              style={{
                padding: '12px',
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? '#fbbf24' : '#1e293b',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <Link 
              to="/admin/events" 
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <FaCalendarAlt /> إدارة الفعاليات
            </Link>
            <Link 
              to="/admin/pending" 
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <FaUserClock /> طلبات التسجيل
            </Link>
            <Link 
              to="/admin/attendance" 
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              <FaClipboardList /> سجلات الحضور
            </Link>
            <Link 
              to="/admin/scanner" 
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 153, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 153, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 153, 255, 0.3)';
              }}
            >
              <FaQrcode /> ماسح QR
            </Link>
          </div>
        </motion.div>

        {/* Modern Dashboard Stats */}
        <motion.div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            whileHover={{ scale: 1.03, y: -5 }}
            style={{
              background: 'linear-gradient(135deg, #003DA5 0%, #0052d4 100%)',
              padding: '24px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(0, 61, 165, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}><FaUsers /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '8px 0' }}>{dashboardStats.totalUsers}</h3>
              <p style={{ opacity: 0.9, fontSize: '1rem' }}>إجمالي المستخدمين</p>
            </div>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }} />
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03, y: -5 }}
            style={{
              background: 'linear-gradient(135deg, #E31E24 0%, #B71C1C 100%)',
              padding: '24px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(227, 30, 36, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}><FaUserClock /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '8px 0' }}>{dashboardStats.pendingRegistrations}</h3>
              <p style={{ opacity: 0.9, fontSize: '1rem' }}>طلبات معلقة</p>
            </div>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }} />
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03, y: -5 }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '24px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}><FaCalendarAlt /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '8px 0' }}>{dashboardStats.activeEvents}</h3>
              <p style={{ opacity: 0.9, fontSize: '1rem' }}>فعاليات نشطة</p>
            </div>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }} />
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03, y: -5 }}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '24px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}><FaClipboardList /></div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '8px 0' }}>{dashboardStats.totalTasks}</h3>
              <p style={{ opacity: 0.9, fontSize: '1rem' }}>إجمالي المهام</p>
            </div>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }} />
          </motion.div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="stats-grid" ref={statsRef}>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon">
              <FaUser />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>إجمالي الأعضاء</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon">
              <FaMapMarkerAlt />
            </div>
            <div className="stat-info">
              <h3>{Object.keys(stats.byGovernorate).length}</h3>
              <p>عدد المحافظات</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{Object.keys(stats.byCommittee).length}</h3>
              <p>عدد اللجان</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          className="filters-section"
          ref={filtersRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="البحث بالاسم، البريد، الهاتف، أو رقم الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterGovernorate}
            onChange={(e) => setFilterGovernorate(e.target.value)}
            className="filter-select"
          >
            <option value="">كل المحافظات</option>
            {governorates.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>

          <select
            value={filterCommittee}
            onChange={(e) => setFilterCommittee(e.target.value)}
            className="filter-select"
          >
            <option value="">كل اللجان</option>
            {committees.map(committee => (
              <option key={committee} value={committee}>{committee}</option>
            ))}
          </select>

          <button onClick={exportToCSV} className="export-btn">
            <FaDownload /> تصدير XLSX
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setViewMode('cards')} 
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              style={{
                padding: '12px 20px',
                background: viewMode === 'cards' ? 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)' : '#f3f4f6',
                color: viewMode === 'cards' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontFamily: 'Cairo, sans-serif'
              }}
            >
              <FaTh /> عرض البطاقات
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              style={{
                padding: '12px 20px',
                background: viewMode === 'table' ? 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)' : '#f3f4f6',
                color: viewMode === 'table' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontFamily: 'Cairo, sans-serif'
              }}
            >
              <FaTable /> عرض الجدول
            </button>
          </div>
        </motion.div>

        {/* Users Display - Cards or Table */}
        {filteredUsers.length === 0 ? (
          <div className="no-data" style={{ marginTop: '40px', padding: '60px 20px', background: 'white', borderRadius: '16px', textAlign: 'center' }}>
            <FaUser size={60} style={{ color: '#d1d5db', marginBottom: '20px' }} />
            <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>لا توجد بيانات</p>
          </div>
        ) : viewMode === 'cards' ? (
          <motion.div 
            className="users-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredUsers.map((user, index) => (
              <UserCard 
                key={user.id} 
                user={user} 
                index={index}
                onClick={setSelectedUser}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th><FaUser /> الاسم</th>
                    <th><FaEnvelope /> البريد الإلكتروني</th>
                    <th><FaPhone /> رقم الهاتف</th>
                    <th><FaIdCard /> رقم الهوية</th>
                    <th><FaMapMarkerAlt /> المحافظة</th>
                    <th><FaUsers /> اللجنة</th>
                    <th><FaUser /> الدور الوظيفي</th>
                    <th><FaCalendar /> تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{index + 1}</td>
                      <td className="user-name">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.number}</td>
                      <td className="user-id">{user.userId}</td>
                      <td>
                        <span className="badge badge-governorate">{user.governorate}</span>
                      </td>
                      <td>
                        <span className="badge badge-committee">{user.committee}</span>
                      </td>
                      <td>
                        <span className="badge badge-role">{user.role || 'غير محدد'}</span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('ar-EG')}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <UserDetailsModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
