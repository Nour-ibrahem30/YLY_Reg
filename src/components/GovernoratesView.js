import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMapMarkerAlt, FaUsers, FaChartBar, FaArrowLeft, 
  FaMoon, FaSun, FaSearch, FaFilter, FaTrophy, FaStar,
  FaUserFriends, FaBuilding, FaChevronRight
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import '../styles/GovernoratesView.css';

function GovernoratesView() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [governoratesData, setGovernoratesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [sortBy, setSortBy] = useState('members'); // members, name, committees
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ];

  useEffect(() => {
    fetchGovernoratesData();
  }, []);

  useEffect(() => {
    let filtered = [...governoratesData];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(gov =>
        gov.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    if (sortBy === 'members') {
      filtered.sort((a, b) => b.totalMembers - a.totalMembers);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'committees') {
      filtered.sort((a, b) => Object.keys(b.committees).length - Object.keys(a.committees).length);
    }
    
    setFilteredData(filtered);
  }, [searchTerm, governoratesData, sortBy]);

  const fetchGovernoratesData = async () => {
    setLoading(true);
    try {
      const data = [];

      // جلب البيانات من users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersByGov = {};
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const gov = userData.governorate;
        if (!usersByGov[gov]) {
          usersByGov[gov] = [];
        }
        usersByGov[gov].push({ id: doc.id, ...userData });
      });

      // جلب البيانات من كل محافظة
      for (const gov of governorates) {
        try {
          const govSnapshot = await getDocs(collection(db, gov));
          if (!usersByGov[gov]) {
            usersByGov[gov] = [];
          }
          govSnapshot.forEach((doc) => {
            usersByGov[gov].push({ id: doc.id, ...doc.data() });
          });
        } catch (error) {
          console.warn(`Error fetching ${gov}:`, error);
        }
      }

      // تنظيم البيانات
      for (const gov of governorates) {
        const users = usersByGov[gov] || [];
        const committees = {};
        let totalPoints = 0;
        
        users.forEach(user => {
          const committee = user.committee || 'غير محدد';
          if (!committees[committee]) {
            committees[committee] = 0;
          }
          committees[committee]++;
          totalPoints += user.points || 0;
        });

        data.push({
          name: gov,
          totalMembers: users.length,
          committees: committees,
          users: users,
          totalPoints: totalPoints
        });
      }

      setGovernoratesData(data);
    } catch (error) {
      console.error('Error fetching governorates data:', error);
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
            <p>جاري تحميل بيانات المحافظات...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalMembers = governoratesData.reduce((sum, gov) => sum + gov.totalMembers, 0);
  const totalCommittees = governoratesData.reduce((sum, gov) => sum + Object.keys(gov.committees).length, 0);
  const totalPoints = governoratesData.reduce((sum, gov) => sum + gov.totalPoints, 0);

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        <div className={`governorates-page ${darkMode ? 'dark' : ''}`}>
      <div className="governorates-container">
        {/* Top Bar */}
        <motion.div 
          className="gov-topbar"
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

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div 
          className="gov-header-modern"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="header-title-section">
            <div className="header-icon-large">
              <FaMapMarkerAlt />
            </div>
            <div>
              <h1>محافظات مصر</h1>
              <p>إدارة ومتابعة جميع المحافظات واللجان والأعضاء</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="stats-overview-grid">
          <motion.div 
            className="stat-card-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon-wrapper governorates">
              <FaMapMarkerAlt />
            </div>
            <div className="stat-content">
              <h3>{governoratesData.length}</h3>
              <p>محافظة</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-icon-wrapper members">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>{totalMembers.toLocaleString()}</h3>
              <p>إجمالي الأعضاء</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="stat-icon-wrapper committees">
              <FaBuilding />
            </div>
            <div className="stat-content">
              <h3>{totalCommittees}</h3>
              <p>إجمالي اللجان</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="stat-icon-wrapper points">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <h3>{totalPoints.toLocaleString()}</h3>
              <p>إجمالي النقاط</p>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div 
          className="filters-section-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="search-box-modern">
            <FaSearch />
            <input 
              type="text" 
              placeholder="ابحث عن محافظة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="members">الأكثر أعضاء</option>
              <option value="name">الترتيب الأبجدي</option>
              <option value="committees">الأكثر لجان</option>
            </select>
          </div>
        </motion.div>

        {/* Governorates Grid */}
        <AnimatePresence>
          <div className="governorates-grid-modern">
            {filteredData.map((gov, index) => (
              <motion.div
                key={gov.name}
                className="governorate-card-modern"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/admin/governorate/${gov.name}`)}
              >
                <div className="gov-card-header-modern">
                  <div className="gov-icon-modern">
                    <FaMapMarkerAlt />
                  </div>
                  <h2>{gov.name}</h2>
                  <div className="gov-rank">
                    <FaStar />
                    <span>#{index + 1}</span>
                  </div>
                </div>

                <div className="gov-card-body-modern">
                  <div className="gov-stats-row">
                    <div className="gov-stat-item">
                      <FaUsers className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{gov.totalMembers}</span>
                        <span className="stat-label">عضو</span>
                      </div>
                    </div>

                    <div className="gov-stat-item">
                      <FaBuilding className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{Object.keys(gov.committees).length}</span>
                        <span className="stat-label">لجنة</span>
                      </div>
                    </div>

                    <div className="gov-stat-item">
                      <FaTrophy className="stat-icon-small" />
                      <div>
                        <span className="stat-number">{gov.totalPoints}</span>
                        <span className="stat-label">نقطة</span>
                      </div>
                    </div>
                  </div>

                  {Object.keys(gov.committees).length > 0 && (
                    <div className="committees-preview-modern">
                      <h4>اللجان الرئيسية:</h4>
                      <div className="committees-tags">
                        {Object.entries(gov.committees)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([committee, count]) => (
                            <span key={committee} className="committee-tag">
                              {committee} <span className="count">({count})</span>
                            </span>
                          ))}
                        {Object.keys(gov.committees).length > 3 && (
                          <span className="more-committees">
                            +{Object.keys(gov.committees).length - 3} أخرى
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="gov-card-footer-modern">
                  <span className="view-details-btn">
                    عرض التفاصيل
                    <FaChevronRight />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filteredData.length === 0 && (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaSearch style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '20px' }} />
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على محافظات تطابق بحثك</p>
          </motion.div>
        )}
      </div>
    </div>
      </div>
    </div>
  );
}

export default GovernoratesView;
