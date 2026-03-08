import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUsers, FaChartBar, FaArrowLeft } from 'react-icons/fa';
import '../styles/GovernoratesView.css';

function GovernoratesView() {
  const navigate = useNavigate();
  const [governoratesData, setGovernoratesData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        users.forEach(user => {
          const committee = user.committee || 'غير محدد';
          if (!committees[committee]) {
            committees[committee] = 0;
          }
          committees[committee]++;
        });

        data.push({
          name: gov,
          totalMembers: users.length,
          committees: committees,
          users: users
        });
      }

      // ترتيب حسب عدد الأعضاء
      data.sort((a, b) => b.totalMembers - a.totalMembers);
      setGovernoratesData(data);
    } catch (error) {
      console.error('Error fetching governorates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradientColor = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="governorates-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>جاري تحميل بيانات المحافظات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="governorates-page">
      <div className="governorates-container">
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            className="back-btn"
            onClick={() => navigate('/admin')}
          >
            <FaArrowLeft /> رجوع
          </button>
          <div>
            <h1>المحافظات</h1>
            <p>اختر محافظة لعرض اللجان والأعضاء</p>
          </div>
          <div className="total-stats">
            <FaUsers />
            <span>{governoratesData.reduce((sum, gov) => sum + gov.totalMembers, 0)} عضو</span>
          </div>
        </motion.div>

        <div className="governorates-grid">
          {governoratesData.map((gov, index) => (
            <motion.div
              key={gov.name}
              className="governorate-card"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.03,
                y: -8
              }}
              onClick={() => navigate(`/admin/governorate/${gov.name}`)}
            >
              <div className="gov-card-header" style={{ background: getGradientColor(index) }}>
                <FaMapMarkerAlt className="gov-icon" />
                <h2>{gov.name}</h2>
              </div>

              <div className="gov-card-body">
                <div className="gov-stat">
                  <FaUsers className="stat-icon" />
                  <div className="stat-info">
                    <span className="stat-value">{gov.totalMembers}</span>
                    <span className="stat-label">إجمالي الأعضاء</span>
                  </div>
                </div>

                <div className="gov-stat">
                  <FaChartBar className="stat-icon" />
                  <div className="stat-info">
                    <span className="stat-value">{Object.keys(gov.committees).length}</span>
                    <span className="stat-label">عدد اللجان</span>
                  </div>
                </div>

                <div className="committees-preview">
                  <h4>اللجان:</h4>
                  <div className="committees-list">
                    {Object.entries(gov.committees).map(([committee, count]) => (
                      <span key={committee} className="committee-badge">
                        {committee} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="gov-card-footer">
                <span className="view-details">عرض التفاصيل →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GovernoratesView;
