import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaUserTie, FaCalendar, FaUniversity } from 'react-icons/fa';

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
            >
              {getInitials(user.name)}
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
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UserDetailsModal;
