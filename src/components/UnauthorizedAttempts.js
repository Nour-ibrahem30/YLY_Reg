import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaCalendarAlt, FaClock, FaGlobe, FaDesktop, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getUnauthorizedAttempts } from '../services/faceRecognitionService';
import Sidebar from './Sidebar';
import '../styles/UnauthorizedAttempts.css';

function UnauthorizedAttempts() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const data = await getUnauthorizedAttempts(100);
      setAttempts(data);
    } catch (error) {
      console.error('Error loading attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBrowserInfo = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar isAdmin={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>جاري تحميل محاولات الدخول...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
            <FaArrowLeft />
            <span>العودة</span>
          </button>
          
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaExclamationTriangle className="header-icon" />
            </div>
            <div className="header-text">
              <h1>محاولات الدخول غير المصرح بها</h1>
              <p>جميع المحاولات الفاشلة للوصول إلى لوحة التحكم</p>
            </div>
          </div>

          <div className="stats-badge">
            <span className="stats-number">{attempts.length}</span>
            <span className="stats-label">محاولة</span>
          </div>
        </div>

      {attempts.length === 0 ? (
        <motion.div
          className="no-attempts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaExclamationTriangle className="no-attempts-icon" />
          <h3>لا توجد محاولات دخول غير مصرح بها</h3>
          <p>النظام آمن تماماً</p>
        </motion.div>
      ) : (
        <div className="attempts-grid">
          {attempts.map((attempt, index) => (
            <motion.div
              key={attempt.id}
              className="attempt-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAttempt(attempt)}
            >
              <div className="attempt-image">
                <img src={attempt.image_url || attempt.imageUrl} alt="Unauthorized attempt" />
                <div className="attempt-overlay">
                  <FaExclamationTriangle />
                </div>
              </div>

              <div className="attempt-info">
                <div className="info-row">
                  <FaCalendarAlt />
                  <span>{formatDate(attempt.timestamp)}</span>
                </div>
                <div className="info-row">
                  <FaClock />
                  <span>{formatTime(attempt.timestamp)}</span>
                </div>
                <div className="info-row">
                  <FaGlobe />
                  <span>{attempt.ip_address || attempt.ipAddress || 'غير معروف'}</span>
                </div>
                <div className="info-row">
                  <FaDesktop />
                  <span>{getBrowserInfo(attempt.user_agent || attempt.userAgent)}</span>
                </div>
                {attempt.distance && (
                  <div className="distance-info">
                    <span>مستوى التطابق: {((1 - attempt.distance) * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

        {/* Modal for full image */}
        {selectedAttempt && (
          <motion.div
            className="attempt-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedAttempt(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => setSelectedAttempt(null)}>
                ✕
              </button>

              <div className="modal-image">
                <img src={selectedAttempt.image_url || selectedAttempt.imageUrl} alt="Unauthorized attempt" />
              </div>

              <div className="modal-details">
                <h3>تفاصيل المحاولة</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <div>
                      <span className="detail-label">التاريخ</span>
                      <span className="detail-value">{formatDate(selectedAttempt.timestamp)}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaClock />
                    <div>
                      <span className="detail-label">الوقت</span>
                      <span className="detail-value">{formatTime(selectedAttempt.timestamp)}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaGlobe />
                    <div>
                      <span className="detail-label">عنوان IP</span>
                      <span className="detail-value">{selectedAttempt.ip_address || selectedAttempt.ipAddress || 'غير معروف'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaDesktop />
                    <div>
                      <span className="detail-label">المتصفح</span>
                      <span className="detail-value">{getBrowserInfo(selectedAttempt.user_agent || selectedAttempt.userAgent)}</span>
                    </div>
                  </div>
                </div>

                {selectedAttempt.distance && (
                  <div className="confidence-bar">
                    <div className="confidence-label">
                      <span>مستوى التطابق</span>
                      <span>{((1 - selectedAttempt.distance) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="confidence-progress">
                      <div
                        className="confidence-fill"
                        style={{ width: `${(1 - selectedAttempt.distance) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default UnauthorizedAttempts;
