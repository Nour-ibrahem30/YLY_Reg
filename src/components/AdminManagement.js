import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { 
  FaUserShield, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes,
  FaTrash,
  FaEye,
  FaCalendar,
  FaImage,
  FaPlus,
  FaCamera
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import { registerAdminFace, loadModels } from '../services/faceRecognitionService';
import '../styles/AdminManagement.css';

function AdminManagement() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadAdmins();
    initModels();
  }, []);

  const initModels = async () => {
    const loaded = await loadModels();
    setModelsLoaded(loaded);
  };

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

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminName.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال اسم الأدمن' });
      return;
    }

    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setMessage({ type: 'error', text: 'يرجى إدخال بريد إلكتروني صحيح' });
      return;
    }

    if (!webcamRef.current) {
      setMessage({ type: 'error', text: 'الكاميرا غير متاحة' });
      return;
    }

    try {
      setCapturing(true);
      setMessage({ type: 'info', text: 'جاري التقاط الصورة...' });

      // Countdown
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setCountdown(null);

      // Capture image
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('فشل التقاط الصورة');
      }

      setCapturedImage(imageSrc);
      setMessage({ type: 'info', text: 'جاري إضافة الأدمن...' });

      // Register face - will be approved automatically since admin is adding
      await registerAdminFace(imageSrc, newAdminName, newAdminEmail);

      setMessage({ type: 'success', text: 'تم إضافة الأدمن بنجاح!' });
      
      // Reset form
      setShowAddModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setCapturedImage(null);
      setCapturing(false);
      
      // Reload admins
      loadAdmins();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء إضافة الأدمن' });
      setCapturedImage(null);
      setCapturing(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewAdminName('');
    setNewAdminEmail('');
    setCapturedImage(null);
    setCapturing(false);
    setCountdown(null);
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
              <button 
                className="add-admin-btn"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus />
                <span>إضافة أدمن جديد</span>
              </button>
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

        {/* Add Admin Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div 
              className="add-admin-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelAdd}
            >
              <motion.div 
                className="add-admin-modal-content"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>إضافة أدمن جديد</h2>
                  <button className="close-modal-btn" onClick={handleCancelAdd}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleAddAdmin}>
                  <div className="form-group">
                    <label>اسم الأدمن</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="أدخل اسم الأدمن"
                      required
                      disabled={capturing}
                    />
                  </div>

                  <div className="form-group">
                    <label>البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      disabled={capturing}
                    />
                  </div>

                  <div className="webcam-section">
                    <label>صورة الوجه</label>
                    <div className="webcam-wrapper">
                      {countdown && (
                        <div className="countdown-overlay">
                          <motion.div
                            className="countdown-number"
                            key={countdown}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                          >
                            {countdown}
                          </motion.div>
                        </div>
                      )}

                      {capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="captured-preview" />
                      ) : (
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          className="webcam-preview"
                          mirrored={true}
                          videoConstraints={{
                            width: 640,
                            height: 480,
                            facingMode: 'user'
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={capturing || !modelsLoaded}
                    >
                      {capturing ? (
                        <>
                          <span className="spinner"></span>
                          <span>جاري المعالجة...</span>
                        </>
                      ) : (
                        <>
                          <FaCamera />
                          <span>التقاط الصورة وإضافة</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancelAdd}
                      disabled={capturing}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminManagement;
