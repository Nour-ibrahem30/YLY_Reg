import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaUserTie, FaCalendar, FaUniversity, FaImage, FaUser } from 'react-icons/fa';

function UserDetailsModal({ user, onClose }) {
  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay-enhanced"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content-enhanced"
          initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotateX: -90 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          <div className="modal-header-enhanced">
            <motion.div 
              className="modal-avatar"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              style={{
                backgroundImage: user.profilePhotoURL ? `url(${user.profilePhotoURL})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: user.profilePhotoURL ? 'pointer' : 'default'
              }}
              onClick={() => user.profilePhotoURL && window.open(user.profilePhotoURL, '_blank')}
              title={user.profilePhotoURL ? 'اضغط لعرض الصورة بالحجم الكامل' : ''}
            >
              {!user.profilePhotoURL && getInitials(user.name)}
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {user.name}
            </motion.h2>
            <motion.div 
              className="modal-badges"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="badge badge-governorate">{user.governorate}</span>
              <span className="badge badge-committee">{user.committee}</span>
              <span className="badge badge-role">{user.role || 'Member'}</span>
            </motion.div>
          </div>

          <motion.div 
            className="modal-body-enhanced"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="detail-grid">
              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaEnvelope />
                </div>
                <div className="detail-content">
                  <span className="detail-label">البريد الإلكتروني</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </motion.div>

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaPhone />
                </div>
                <div className="detail-content">
                  <span className="detail-label">رقم الهاتف</span>
                  <span className="detail-value">{user.number}</span>
                </div>
              </motion.div>

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaIdCard />
                </div>
                <div className="detail-content">
                  <span className="detail-label">رقم الهوية</span>
                  <span className="detail-value">{user.userId}</span>
                </div>
              </motion.div>

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="detail-content">
                  <span className="detail-label">المحافظة</span>
                  <span className="detail-value">{user.governorate}</span>
                </div>
              </motion.div>

              {user.university && (
                <motion.div 
                  className="detail-item"
                  whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
                >
                  <div className="detail-icon">
                    <FaUniversity />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">الكلية / الجامعة</span>
                    <span className="detail-value">{user.university}</span>
                  </div>
                </motion.div>
              )}

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaUsers />
                </div>
                <div className="detail-content">
                  <span className="detail-label">اللجنة</span>
                  <span className="detail-value">{user.committee}</span>
                </div>
              </motion.div>

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaUserTie />
                </div>
                <div className="detail-content">
                  <span className="detail-label">الدور الوظيفي</span>
                  <span className="detail-value">{user.role || 'غير محدد'}</span>
                </div>
              </motion.div>

              <motion.div 
                className="detail-item"
                whileHover={{ scale: 1.05, backgroundColor: "#f0f9ff" }}
              >
                <div className="detail-icon">
                  <FaCalendar />
                </div>
                <div className="detail-content">
                  <span className="detail-label">تاريخ التسجيل</span>
                  <span className="detail-value">
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Photos Section */}
            {(user.profilePhotoURL || user.idCardPhotoURL) && (
              <motion.div 
                className="photos-section"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  marginTop: '30px',
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}
              >
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FaImage /> الصور المرفقة
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: user.profilePhotoURL && user.idCardPhotoURL ? '1fr 1fr' : '1fr',
                  gap: '20px'
                }}>
                  {user.profilePhotoURL && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '15px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(user.profilePhotoURL, '_blank')}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        color: '#003DA5',
                        fontWeight: '600'
                      }}>
                        <FaUser />
                        <span>صورة البروفايل</span>
                      </div>
                      <img 
                        src={user.profilePhotoURL} 
                        alt="Profile"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}
                      />
                      <p style={{
                        marginTop: '10px',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        اضغط للعرض بالحجم الكامل
                      </p>
                    </motion.div>
                  )}

                  {user.idCardPhotoURL && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '15px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(user.idCardPhotoURL, '_blank')}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        color: '#E31E24',
                        fontWeight: '600'
                      }}>
                        <FaIdCard />
                        <span>صورة البطاقة</span>
                      </div>
                      <img 
                        src={user.idCardPhotoURL} 
                        alt="ID Card"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}
                      />
                      <p style={{
                        marginTop: '10px',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        اضغط للعرض بالحجم الكامل
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UserDetailsModal;
