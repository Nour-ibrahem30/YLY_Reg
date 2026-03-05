import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaCalendar, FaSearch, FaDownload, FaQrcode, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';

function AdminDashboard() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGovernorate, setFilterGovernorate] = useState('');
  const [filterCommittee, setFilterCommittee] = useState('');

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
      
      console.log('Starting to fetch data from', governorates.length, 'governorates...');
      
      // جلب البيانات من كل محافظة
      for (const gov of governorates) {
        try {
          const querySnapshot = await getDocs(collection(db, gov));
          console.log(`Fetched ${querySnapshot.size} users from ${gov}`);
          querySnapshot.forEach((doc) => {
            users.push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (govError) {
          console.warn(`Error fetching from ${gov}:`, govError);
          // Continue with other governorates even if one fails
        }
      }
      
      console.log('Total users fetched:', users.length);
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('حدث خطأ في تحميل البيانات. تأكد من صلاحيات Firebase.');
    } finally {
      setLoading(false);
    }
  }, [governorates]);

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
    fetchAllUsers();
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const exportToCSV = () => {
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

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yly_members_${new Date().toISOString().split('T')[0]}.csv`;
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

        {/* Statistics Cards */}
        <div className="stats-grid">
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
            <FaDownload /> تصدير Excel
          </button>
        </motion.div>

        {/* Users Table */}
        <motion.div 
          className="table-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {filteredUsers.length === 0 ? (
            <div className="no-data">لا توجد بيانات</div>
          ) : (
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
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard;
