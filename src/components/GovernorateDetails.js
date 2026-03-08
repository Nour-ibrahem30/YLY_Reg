import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUsers, FaChartBar } from 'react-icons/fa';
import '../styles/GovernorateDetails.css';

function GovernorateDetails() {
  const { governorate } = useParams();
  const navigate = useNavigate();
  const [committeesData, setCommitteesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchGovernorateData();
  }, [governorate]);

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
      users.forEach(user => {
        const committee = user.committee || 'غير محدد';
        if (!committees[committee]) {
          committees[committee] = [];
        }
        committees[committee].push(user);
      });

      const committeesArray = Object.entries(committees).map(([name, members]) => ({
        name,
        members,
        count: members.length
      }));

      committeesArray.sort((a, b) => b.count - a.count);
      
      setCommitteesData(committeesArray);
      setTotalMembers(users.length);
    } catch (error) {
      console.error('Error fetching governorate data:', error);
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
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="governorate-details-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>جاري تحميل بيانات {governorate}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="governorate-details-page">
      <div className="governorate-details-container">
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            className="back-btn"
            onClick={() => navigate('/admin/governorates')}
          >
            <FaArrowLeft /> رجوع للمحافظات
          </button>
          <div>
            <h1>{governorate}</h1>
            <p>اللجان والأعضاء</p>
          </div>
          <div className="total-stats">
            <FaUsers />
            <span>{totalMembers} عضو</span>
          </div>
        </motion.div>

        <div className="stats-overview">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <FaUsers className="stat-icon" />
            <div>
              <h3>{totalMembers}</h3>
              <p>إجمالي الأعضاء</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FaChartBar className="stat-icon" />
            <div>
              <h3>{committeesData.length}</h3>
              <p>عدد اللجان</p>
            </div>
          </motion.div>
        </div>

        <div className="committees-grid">
          {committeesData.map((committee, index) => (
            <motion.div
              key={committee.name}
              className="committee-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.02,
                y: -5
              }}
              onClick={() => navigate(`/admin/governorate/${governorate}/committee/${committee.name}`)}
            >
              <div className="committee-header" style={{ background: getGradientColor(index) }}>
                <h2>{committee.name}</h2>
                <span className="member-count">{committee.count} عضو</span>
              </div>

              <div className="committee-body">
                <div className="members-preview">
                  {committee.members.slice(0, 5).map((member, idx) => (
                    <div key={member.id} className="member-preview-item">
                      <div className="member-avatar">
                        {member.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                  ))}
                  {committee.count > 5 && (
                    <div className="more-members">
                      +{committee.count - 5} المزيد
                    </div>
                  )}
                </div>
              </div>

              <div className="committee-footer">
                <span className="view-details">عرض جميع الأعضاء →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GovernorateDetails;
