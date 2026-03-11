import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaUsers, FaChartBar, FaMoon, FaSun, 
  FaSearch, FaLayerGroup, FaTrophy, FaStar, FaUserFriends,
  FaChevronRight, FaFilter, FaSort, FaMedal
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/GovernorateDetails.css';

function GovernorateDetails() {
  const { governorate } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [committeesData, setCommitteesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCommittees, setFilteredCommittees] = useState([]);
  const [sortBy, setSortBy] = useState('members'); // members, name, points

  useEffect(() => {
    fetchGovernorateData();
  }, [governorate]);

  useEffect(() => {
    let filtered = [...committeesData];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(committee =>
        committee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    if (sortBy === 'members') {
      filtered.sort((a, b) => b.count - a.count);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'points') {
      filtered.sort((a, b) => b.totalPoints - a.totalPoints);
    }
    
    setFilteredCommittees(filtered);
  }, [searchTerm, committeesData, sortBy]);

  const fetchGovernorateData = async () => {
    setLoading(true);
    try {
      const users = [];

      // جلب من users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.governorate === governorate) {
          users.push({ id: doc.id, ...userData });
        }
      });

      // جلب من محافظة محددة
      try {
        const govSnapshot = await getDocs(collection(db, governorate));
        govSnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.warn(`Error fetching ${governorate}:`, error);
      }

      // تنظيم البيانات حسب اللجان
      const committees = {};
      let totalPts = 0;
      
      users.forEach(user => {
        const committee = user.committee || 'غير محدد';
        if (!committees[committee]) {
          committees[committee] = {
            members: [],
            totalPoints: 0
          };
        }
        committees[committee].members.push(user);
        committees[committee].totalPoints += user.points || 0;
        totalPts += user.points || 0;
      });

      const committeesArray = Object.entries(committees).map(([name, data]) => ({
        name,
        members: data.members,
        count: data.members.length,
        totalPoints: data.totalPoints,
        avgPoints: Math.round(data.totalPoints / data.members.length) || 0
      }));

      setCommitteesData(committeesArray);
      setTotalMembers(users.length);
      setTotalPoints(totalPts);
    } catch (error) {
      console.error('Error fetching governorate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`governorate-details-page ${darkMode ? 'dark' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري تحميل بيانات {governorate}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`governorate-details-page ${darkMode ? 'dark' : ''}`}>
      <div className="governorate-details-container">
        {/* Top Bar */}
        <motion.div 
          className="gov-details-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            className="back-btn-modern"
            onClick={() => navigate('/admin/governorates')}
          >
            <FaArrowLeft />
            <span>العودة للمحافظات</span>
          </button>

          <div className="topbar-actions">
            <button className="icon-btn-modern" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div 
          className="gov-details-header-modern"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="header-title-section">
            <div className="header-icon-large">
              <FaLayerGroup />
            </div>
            <div>
              <h1>{governorate}</h1>
              <p>اللجان والأعضاء المسجلين في المحافظة</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="stats-overview-grid">
          <motion.div 
            className="stat-card-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon-wrapper committees-icon">
              <FaLayerGroup />
            </div>
            <div className="stat-content">
              <h3>{committeesData.length}</h3>
              <p>عدد اللجان</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-icon-wrapper members-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>{totalMembers}</h3>
              <p>إجمالي الأعضاء</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="stat-icon-wrapper points-icon">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <h3>{totalPoints.toLocaleString()}</h3>
              <p>إجمالي النقاط</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="stat-icon-wrapper avg-icon">
              <FaMedal />
            </div>
            <div className="stat-content">
              <h3>{totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0}</h3>
              <p>متوسط النقاط</p>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div 
          className="filters-section-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="search-box-details">
            <FaSearch />
            <input 
              type="text" 
              placeholder="ابحث عن لجنة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select 
              className="sort-select-details"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="members">الأكثر أعضاء</option>
              <option value="name">الترتيب الأبجدي</option>
              <option value="points">الأكثر نقاط</option>
            </select>
          </div>
        </motion.div>

        {/* Committees Grid */}
        <AnimatePresence>
          <div className="committees-grid-modern">
            {filteredCommittees.map((committee, index) => (
              <motion.div
                key={committee.name}
                className="committee-card-modern"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/admin/governorate/${governorate}/committee/${committee.name}`)}
              >
                <div className="committee-card-header-modern">
                  <div className="committee-icon-modern">
                    <FaUserFriends />
                  </div>
                  <div className="committee-title-section">
                    <h2>{committee.name}</h2>
                    <div className="committee-rank">
                      <FaStar />
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="committee-card-body-modern">
                  <div className="committee-stats-row">
                    <div className="committee-stat-item">
                      <FaUsers className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{committee.count}</span>
                        <span className="stat-label">عضو</span>
                      </div>
                    </div>

                    <div className="committee-stat-item">
                      <FaTrophy className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{committee.totalPoints}</span>
                        <span className="stat-label">نقطة</span>
                      </div>
                    </div>

                    <div className="committee-stat-item">
                      <FaMedal className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{committee.avgPoints}</span>
                        <span className="stat-label">متوسط</span>
                      </div>
                    </div>
                  </div>

                  <div className="members-preview-modern">
                    <h4>الأعضاء:</h4>
                    <div className="members-avatars">
                      {committee.members.slice(0, 5).map((member, idx) => (
                        <div key={member.id} className="member-avatar-item" title={member.name}>
                          {member.profilePhotoURL ? (
                            <img src={member.profilePhotoURL} alt={member.name} />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {member.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                      ))}
                      {committee.count > 5 && (
                        <div className="more-members-badge">
                          +{committee.count - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top 3 Members */}
                  {committee.members.length > 0 && (
                    <div className="top-members-section">
                      <h4>أفضل الأعضاء:</h4>
                      <div className="top-members-list">
                        {committee.members
                          .sort((a, b) => (b.points || 0) - (a.points || 0))
                          .slice(0, 3)
                          .map((member, idx) => (
                            <div key={member.id} className="top-member-item">
                              <div className="member-rank-badge">
                                {idx === 0 && '🥇'}
                                {idx === 1 && '🥈'}
                                {idx === 2 && '🥉'}
                              </div>
                              <span className="member-name">{member.name}</span>
                              <span className="member-points">{member.points || 0} نقطة</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="committee-card-footer-modern">
                  <span className="view-details-btn">
                    عرض جميع الأعضاء
                    <FaChevronRight />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filteredCommittees.length === 0 && (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaSearch style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '20px' }} />
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على لجان تطابق بحثك</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default GovernorateDetails;
