import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import UserCard from './UserCard';
import UserDetailsModal from './UserDetailsModal';
import '../styles/CommitteeMembers.css';

function CommitteeMembers() {
  const { governorate, committee } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchCommitteeMembers();
  }, [governorate, committee]);

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
      <div className="committee-members-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>جاري تحميل أعضاء اللجنة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="committee-members-page">
      <div className="committee-members-container">
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            className="back-btn"
            onClick={() => navigate(`/admin/governorate/${governorate}`)}
          >
            <FaArrowLeft /> رجوع
          </button>
          <div>
            <h1>{committee}</h1>
            <p>{governorate} - {members.length} عضو</p>
          </div>
          <button className="export-btn" onClick={exportToCSV}>
            <FaDownload /> تصدير Excel
          </button>
        </motion.div>

        {members.length === 0 ? (
          <motion.div 
            className="no-members"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p>لا يوجد أعضاء في هذه اللجنة</p>
          </motion.div>
        ) : (
          <div className="users-grid">
            {members.map((member, index) => (
              <UserCard
                key={member.id}
                user={member}
                index={index}
                onClick={setSelectedUser}
              />
            ))}
          </div>
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
