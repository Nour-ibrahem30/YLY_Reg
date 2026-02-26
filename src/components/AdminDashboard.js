import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaCalendar, FaSearch, FaDownload } from 'react-icons/fa';

function AdminDashboard() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGovernorate, setFilterGovernorate] = useState('');
  const [filterCommittee, setFilterCommittee] = useState('');

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ];

  const committees = ['PR', 'HR', 'R&D', 'Social Media', 'OR'];

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterGovernorate, filterCommittee, allUsers]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const users = [];
      
      // جلب البيانات من كل محافظة
      for (const gov of governorates) {
        const querySnapshot = await getDocs(collection(db, gov));
        querySnapshot.forEach((doc) => {
          users.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
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
  };

  const exportToCSV = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الهوية', 'المحافظة', 'اللجنة', 'تاريخ التسجيل'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.number,
      user.userId,
      user.governorate,
      user.committee,
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
        <div className="loading">جاري تحميل البيانات...</div>
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
          <h1>لوحة تحكم الأدمن</h1>
          <p>إدارة أعضاء YLY</p>
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
