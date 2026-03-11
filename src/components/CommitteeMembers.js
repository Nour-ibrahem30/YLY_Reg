import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaDownload, FaUsers, FaSearch, FaFilter,
  FaMoon, FaSun, FaUserCircle, FaEnvelope, FaPhone, FaIdCard
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import UserCard from './UserCard';
import UserDetailsModal from './UserDetailsModal';
import '../styles/CommitteeMembers.css';

function CommitteeMembers() {
  const { governorate, committee } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);

  useEffect(() => {
    fetchCommitteeMembers();
  }, [governorate, committee]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.number?.includes(searchTerm) ||
        member.userId?.includes(searchTerm)
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const fetchCommitteeMembers = async () => {
    setLoading(true);
    try {
      const users = [];

      // جلب من users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.governorate === governorate && userData.committee === committee) {
          users.push({ id: doc.id, ...userData });
        }
      });

      // جلب من محافظة محددة
      try {
        const govSnapshot = await getDocs(collection(db, governorate));
        govSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.committee === committee) {
            users.push({ id: doc.id, ...userData });
          }
        });
      } catch (error) {
        console.warn(`Error fetching ${governorate}:`, error);
      }

      setMembers(users);
    } catch (error) {
      console.error('Error fetching committee members:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الهوية', 'المحافظة', 'اللجنة', 'الدور الوظيفي', 'الكلية/الجامعة'];
    const csvData = members.map(member => [
      member.name,
      member.email,
      member.number,
      member.userId,
      member.governorate,
      member.committee,
      member.role || 'غير محدد',
      member.university || 'غير محدد'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${governorate}_${committee}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className={`committee-members-page ${darkMode ? 'dark' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري تحميل أعضاء اللجنة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`committee-members-page ${darkMode ? 'dark' : ''}`}>
      <div className="committee-members-container">
        {/* Top Bar */}
        <motion.div 
          className="committee-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="topbar-left">
            <button 
              className="back-btn"
              onClick={() => navigate(`/admin/governorate/${governorate}`)}
            >
              <FaArrowLeft />
              <span>رجوع</span>
            </button>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div 
          className="committee-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="header-content">
            <div className="header-icon">
              <FaUsers />
            </div>
            <div className="header-info">
              <h1>{committee}</h1>
              <p>{governorate}</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{members.length}</span>
              <span className="stat-label">إجمالي الأعضاء</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{filteredMembers.length}</span>
              <span className="stat-label">نتائج البحث</span>
            </div>
          </div>
        </motion.div>

        {/* Actions Bar */}
        <motion.div 
          className="actions-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="search-box">
            <FaSearch />
            <input 
              type="text" 
              placeholder="بحث بالاسم، البريد، الهاتف، أو رقم الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="export-btn" onClick={exportToCSV}>
            <FaDownload />
            <span>تصدير Excel</span>
          </button>
        </motion.div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <motion.div 
            className="no-members"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="no-members-icon">
              <FaUsers />
            </div>
            <h3>لا يوجد أعضاء</h3>
            <p>{searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لا يوجد أعضاء في هذه اللجنة'}</p>
          </motion.div>
        ) : (
          <motion.div 
            className="members-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                className="member-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 10) }}
                onClick={() => setSelectedUser(member)}
              >
                <div className="member-avatar">
                  {member.profilePhotoURL ? (
                    <img src={member.profilePhotoURL} alt={member.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {member.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                <div className="member-info">
                  <h3>{member.name}</h3>
                  
                  <div className="member-details">
                    <div className="detail-item">
                      <FaEnvelope />
                      <span>{member.email}</span>
                    </div>
                    <div className="detail-item">
                      <FaPhone />
                      <span>{member.number}</span>
                    </div>
                    <div className="detail-item">
                      <FaIdCard />
                      <span>{member.userId}</span>
                    </div>
                  </div>

                  {member.role && (
                    <div className="member-badge">
                      {member.role}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

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

export default CommitteeMembers;
