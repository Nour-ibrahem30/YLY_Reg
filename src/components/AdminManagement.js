import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  FaUserShield, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes,
  FaTrash,
  FaEye,
  FaCalendar,
  FaImage
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import '../styles/AdminManagement.css';

function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const adminsSnapshot = await getDocs(collection(db, 'admin_faces'));
      const adminsData = [];
      const pendingData = [];

      adminsSnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (data.status === 'approved') {
          adminsData.push(data);
        } else if (data.status === 'pending') {
          pendingData.push(data);
        }
      });

      // Sort by date
      adminsData.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      pendingData.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      setAdmins(adminsData);
      setPendingAdmins(pendingData);
    } catch (error) {
      console.error('Error loading admins:', error);
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adminId) => {
    try {
      await updateDoc(doc(db, 'admin_faces', adminId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: 'تم قبول الأدمن بنجاح!' });
      loadAdmins();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error approving admin:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء قبول الأدمن' });
    }
  };

  const handleReject = async (adminId) => {
    if (window.confirm('هل أنت متأكد من رفض هذا الأدمن؟')) {
      try {
        await deleteDoc(doc(db, 'admin_faces', adminId));
        setMessage({ type: 'success', text: 'تم رفض الأدمن' });
        loadAdmins();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error rejecting admin:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء رفض الأدمن' });
      }
    }
  };

  const handleDelete = async (adminId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الأدمن؟')) {
      try {
        await deleteDoc(doc(db, 'admin_faces', adminId));
        setMessage({ type: 'success', text: 'تم حذف الأدمن بنجاح' });
        loadAdmins();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting admin:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف الأدمن' });
      }
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar isAdmin={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        <div className="admin-management-page">
          <div className="admin-management-container">
            {/* Top Bar */}
            <motion.div 
              className="management-topbar"
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
            </motion.div>

            {/* Header */}
            <motion.div 
              className="management-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="header-icon-large">
                <FaUserShield />
              </div>
              <div>
                <h1>إدارة المسؤولين</h1>
                <p>قبول ورفض وإدارة المسؤولين في النظام</p>
              </div>
            </motion.div>

            {/* Message */}
            {message.text && (
              <motion.div
                className={`message-alert ${message.type}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {message.text}
              </motion.div>
            )}

            {/* Pending Admins */}
            {pendingAdmins.length > 0 && (
              <motion.div 
                className="section-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="section-header">
                  <h2>طلبات معلقة ({pendingAdmins.length})</h2>
                </div>

                <div className="admins-grid">
                  {pendingAdmins.map((admin, index) => (
                    <motion.div
                      key={admin.id}
                      className="admin-card pending"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <div className="admin-card-header">
                        <div className="admin-avatar" onClick={() => setSelectedImage(admin.imageUrl)}>
                          {admin.imageUrl ? (
                            <img src={admin.imageUrl} alt={admin.name} />
                          ) : (
                            <FaUserShield />
                          )}
                          <div className="view-image-overlay">
                            <FaEye />
                          </div>
                        </div>
                        <div className="admin-info">
                          <h3>{admin.name}</h3>
                          <p className="admin-email">{admin.email}</p>
                          <p className="admin-date">
                            <FaCalendar />
                            {new Date(admin.uploadedAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>

                      <div className="admin-card-actions">
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprove(admin.id)}
                        >
                          <FaCheck /> قبول
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => handleReject(admin.id)}
                        >
                          <FaTimes /> رفض
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Approved Admins */}
            <motion.div 
              className="section-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="section-header">
                <h2>المسؤولين المعتمدين ({admins.length})</h2>
              </div>

              {admins.length === 0 ? (
                <div className="no-data">
                  <FaUserShield />
                  <p>لا يوجد مسؤولين معتمدين حالياً</p>
                </div>
              ) : (
                <div className="admins-grid">
                  {admins.map((admin, index) => (
                    <motion.div
                      key={admin.id}
                      className="admin-card approved"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <div className="admin-card-header">
                        <div className="admin-avatar" onClick={() => setSelectedImage(admin.imageUrl)}>
                          {admin.imageUrl ? (
                            <img src={admin.imageUrl} alt={admin.name} />
                          ) : (
                            <FaUserShield />
                          )}
                          <div className="view-image-overlay">
                            <FaEye />
                          </div>
                        </div>
                        <div className="admin-info">
                          <h3>{admin.name}</h3>
                          <p className="admin-email">{admin.email}</p>
                          <p className="admin-date">
                            <FaCalendar />
                            {new Date(admin.uploadedAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>

                      <div className="admin-card-actions">
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <FaTrash /> حذف
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="image-modal" onClick={() => setSelectedImage(null)}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedImage(null)}>
                <FaTimes />
              </button>
              <img src={selectedImage} alt="Admin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManagement;
