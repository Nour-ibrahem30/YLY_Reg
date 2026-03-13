import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaUserCheck, FaUserTimes, FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaUserTie, FaArrowLeft } from 'react-icons/fa';
import Sidebar from './Sidebar';
import Toast from './Toast';

function PendingRegistrations() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'pending_registrations'));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setPendingUsers(users);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (user) => {
    setProcessing(user.id);
    try {
      // إضافة المستخدم في users
      await addDoc(collection(db, 'users'), {
        name: user.name,
        email: user.email,
        number: user.number,
        userId: user.userId,
        governorate: user.governorate,
        university: user.university,
        committee: user.committee,
        role: user.role,
        password: user.password, // Keep for backward compatibility
        passwordHash: user.passwordHash || null, // Store hashed version
        profilePhotoURL: user.profilePhotoURL || null,
        idCardPhotoURL: user.idCardPhotoURL || null,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        createdAt: user.createdAt,
        securityVersion: user.securityVersion || '1.0'
      });

      // حذف من pending_registrations
      await deleteDoc(doc(db, 'pending_registrations', user.id));

      // تحديث القائمة
      setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
      setToast({ message: 'تم قبول المستخدم بنجاح!', type: 'success' });
    } catch (error) {
      console.error('Error approving user:', error);
      setToast({ message: 'حدث خطأ أثناء قبول المستخدم', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const rejectUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا المستخدم؟')) {
      return;
    }

    setProcessing(userId);
    try {
      // حذف من pending_registrations
      await deleteDoc(doc(db, 'pending_registrations', userId));

      // تحديث القائمة
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setToast({ message: 'تم رفض المستخدم', type: 'info' });
    } catch (error) {
      console.error('Error rejecting user:', error);
      setToast({ message: 'حدث خطأ أثناء رفض المستخدم', type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar isAdmin={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>جاري تحميل طلبات التسجيل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}

        {/* Top Bar */}
        <motion.div 
          className="gov-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="topbar-left">
            <button 
              className="back-btn"
              onClick={() => navigate('/admin/dashboard')}
            >
              <FaArrowLeft />
              <span>رجوع</span>
            </button>
          </div>
        </motion.div>
        
        <div className="admin-container">
        <motion.div 
          className="admin-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>طلبات التسجيل المعلقة</h1>
            <p>مراجعة وقبول أو رفض طلبات التسجيل الجديدة</p>
          </div>
        </motion.div>

        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="stat-icon">
              <FaUser />
            </div>
            <div className="stat-info">
              <h3>{pendingUsers.length}</h3>
              <p>طلبات معلقة</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="table-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {pendingUsers.length === 0 ? (
            <div className="no-data">
              <FaUser size={60} />
              <p>لا توجد طلبات تسجيل معلقة</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الصورة</th>
                    <th><FaUser /> الاسم</th>
                    <th><FaEnvelope /> البريد</th>
                    <th><FaPhone /> الهاتف</th>
                    <th><FaIdCard /> رقم الهوية</th>
                    <th><FaMapMarkerAlt /> المحافظة</th>
                    <th><FaUsers /> اللجنة</th>
                    <th><FaUserTie /> الدور</th>
                    <th>تاريخ الطلب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        {user.profilePhotoURL ? (
                          <img 
                            src={user.profilePhotoURL} 
                            alt={user.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #2563EB',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(user.profilePhotoURL, '_blank')}
                            title="اضغط لعرض الصورة بالحجم الكامل"
                          />
                        ) : (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.2rem'
                          }}>
                            {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </td>
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
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {user.idCardPhotoURL && (
                            <button
                              onClick={() => window.open(user.idCardPhotoURL, '_blank')}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontFamily: 'Cairo, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="عرض صورة البطاقة"
                            >
                              <FaIdCard /> البطاقة
                            </button>
                          )}
                          <button
                            onClick={() => approveUser(user)}
                            disabled={processing === user.id}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: processing === user.id ? 'not-allowed' : 'pointer',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: processing === user.id ? 0.6 : 1
                            }}
                          >
                            <FaUserCheck /> قبول
                          </button>
                          <button
                            onClick={() => rejectUser(user.id)}
                            disabled={processing === user.id}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: processing === user.id ? 'not-allowed' : 'pointer',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: processing === user.id ? 0.6 : 1
                            }}
                          >
                            <FaUserTimes /> رفض
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
}

export default PendingRegistrations;
