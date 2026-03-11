import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaKey, FaHistory, FaDownload, FaToggleOn, FaToggleOff, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import twoFactorAuth from '../utils/twoFactorAuth';
import securityLogger from '../utils/securityLogger';
import '../styles/SecuritySettings.css';

function SecuritySettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        console.log('SecuritySettings - userId from URL:', userId);
        
        // First, try to find user by userId field
        const usersQuery = query(
          collection(db, 'users'),
          where('userId', '==', userId)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data();
          console.log('SecuritySettings - User found:', userData);
          setUserData(userData);
        } else {
          console.log('SecuritySettings - User not found with userId:', userId);
          setMessage({
            type: 'error',
            text: 'لم يتم العثور على بيانات المستخدم'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({
          type: 'error',
          text: 'حدث خطأ أثناء تحميل البيانات'
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    
    // Check if 2FA is enabled
    setIs2FAEnabled(twoFactorAuth.is2FAEnabled(userId));
    
    // Get security statistics
    updateStats();
    
    // Get recent logs
    updateLogs();
  }, [userId]);

  const updateStats = () => {
    const statistics = securityLogger.getStatistics();
    setStats(statistics);
  };

  const updateLogs = () => {
    const recentLogs = securityLogger.getLogs({
      startDate: Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    }).slice(-20); // Last 20 logs
    setLogs(recentLogs);
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (is2FAEnabled) {
        // Disable 2FA
        twoFactorAuth.disable2FA(userId);
        setIs2FAEnabled(false);
        setMessage({
          type: 'success',
          text: 'تم تعطيل التحقق الثنائي بنجاح'
        });
      } else {
        // Enable 2FA
        twoFactorAuth.enable2FA(userId);
        setIs2FAEnabled(true);
        setMessage({
          type: 'success',
          text: 'تم تفعيل التحقق الثنائي بنجاح. سيتم طلب رمز التحقق عند تسجيل الدخول القادم.'
        });
      }

      updateStats();
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      setMessage({
        type: 'error',
        text: 'حدث خطأ. الرجاء المحاولة مرة أخرى.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLogs = (format) => {
    securityLogger.downloadLogs(format);
    setMessage({
      type: 'success',
      text: `تم تنزيل السجلات بصيغة ${format.toUpperCase()}`
    });
  };

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
      securityLogger.clearLogs();
      updateLogs();
      updateStats();
      setMessage({
        type: 'success',
        text: 'تم مسح السجلات بنجاح'
      });
    }
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'login_attempt': 'محاولة دخول',
      'login_success': 'دخول ناجح',
      'login_failed': 'دخول فاشل',
      'registration': 'تسجيل جديد',
      'rate_limit_exceeded': 'تجاوز الحد',
      'attack_detected': 'هجوم مكتشف',
      'file_upload': 'رفع ملف',
      'validation_error': 'خطأ تحقق',
      '2fa_code_generated': 'إنشاء رمز 2FA',
      '2fa_verification_success': 'تحقق 2FA ناجح',
      '2fa_verification_failed': 'تحقق 2FA فاشل',
      '2fa_enabled': 'تفعيل 2FA',
      '2fa_disabled': 'تعطيل 2FA'
    };
    return labels[eventType] || eventType;
  };

  const getLevelColor = (level) => {
    const colors = {
      'debug': '#6b7280',
      'info': '#2563EB',
      'warn': '#f59e0b',
      'error': '#dc2626',
      'critical': '#991b1b'
    };
    return colors[level] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="security-settings">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: '#6b7280' }}>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="security-settings">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#dc2626', fontSize: '1.2rem' }}>لم يتم العثور على بيانات المستخدم</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              background: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: '600'
            }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="security-settings">
      {/* Back button */}
      <motion.button
        className="back-button"
        onClick={() => navigate(-1)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: 'Cairo, sans-serif',
          fontWeight: '600',
          color: '#1f2937',
          fontSize: '1rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <FaArrowLeft />
        رجوع
      </motion.button>

      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-icon">
          <FaShieldAlt />
        </div>
        <h1>إعدادات الأمان</h1>
        <p>إدارة إعدادات الأمان والخصوصية لحسابك</p>
      </motion.div>

      {message.text && (
        <motion.div
          className={`message ${message.type}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {message.text}
        </motion.div>
      )}

      {/* Two-Factor Authentication */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <div className="card-icon">
            <FaLock />
          </div>
          <div>
            <h2>التحقق الثنائي (2FA)</h2>
            <p>أضف طبقة حماية إضافية لحسابك</p>
          </div>
          <button
            className={`toggle-btn ${is2FAEnabled ? 'active' : ''}`}
            onClick={handleToggle2FA}
            disabled={loading}
          >
            {is2FAEnabled ? <FaToggleOn /> : <FaToggleOff />}
          </button>
        </div>

        <div className="card-content">
          <div className="info-box">
            <p>
              {is2FAEnabled
                ? '✅ التحقق الثنائي مفعّل. سيتم طلب رمز التحقق عند تسجيل الدخول.'
                : '⚠️ التحقق الثنائي غير مفعّل. ننصح بتفعيله لحماية أفضل.'}
            </p>
          </div>

          {is2FAEnabled && (
            <div className="delivery-methods">
              <h3>طريقة استلام الرمز:</h3>
              <div className="methods-grid">
                <div className="method-card">
                  <FaEnvelope />
                  <span>البريد الإلكتروني</span>
                  <small>{userData?.email?.replace(/(.{3}).*(@.*)/, '$1***$2')}</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Security Statistics */}
      {stats && (
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <div className="card-icon">
              <FaKey />
            </div>
            <div>
              <h2>إحصائيات الأمان</h2>
              <p>نظرة عامة على نشاط حسابك</p>
            </div>
          </div>

          <div className="card-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">إجمالي الأحداث</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{stats.successfulLogins}</div>
                <div className="stat-label">تسجيل دخول ناجح</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-value">{stats.failedLogins}</div>
                <div className="stat-label">محاولات فاشلة</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-value">{stats.recentAttacks}</div>
                <div className="stat-label">هجمات مكتشفة</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Security Logs */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="card-header">
          <div className="card-icon">
            <FaHistory />
          </div>
          <div>
            <h2>سجل الأحداث الأمنية</h2>
            <p>آخر 20 حدث أمني (آخر 7 أيام)</p>
          </div>
          <button
            className="toggle-logs-btn"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? 'إخفاء' : 'عرض'}
          </button>
        </div>

        {showLogs && (
          <div className="card-content">
            <div className="logs-actions">
              <button
                className="action-btn"
                onClick={() => handleDownloadLogs('json')}
              >
                <FaDownload />
                تنزيل JSON
              </button>
              <button
                className="action-btn"
                onClick={() => handleDownloadLogs('csv')}
              >
                <FaDownload />
                تنزيل CSV
              </button>
              <button
                className="action-btn danger"
                onClick={handleClearLogs}
              >
                مسح السجلات
              </button>
            </div>

            <div className="logs-list">
              {logs.length === 0 ? (
                <div className="no-logs">لا توجد سجلات</div>
              ) : (
                logs.reverse().map((log, index) => (
                  <motion.div
                    key={index}
                    className="log-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="log-level"
                      style={{ background: getLevelColor(log.level) }}
                    >
                      {log.level}
                    </div>
                    <div className="log-content">
                      <div className="log-type">
                        {getEventTypeLabel(log.eventType)}
                      </div>
                      <div className="log-message">{log.message}</div>
                      <div className="log-time">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Security Tips */}
      <motion.div
        className="settings-card tips-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="card-header">
          <div className="card-icon">
            <FaShieldAlt />
          </div>
          <div>
            <h2>نصائح أمنية</h2>
            <p>احمِ حسابك بشكل أفضل</p>
          </div>
        </div>

        <div className="card-content">
          <ul className="tips-list">
            <li>✅ استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز</li>
            <li>✅ فعّل التحقق الثنائي لحماية إضافية</li>
            <li>✅ لا تشارك كلمة المرور مع أي شخص</li>
            <li>✅ غيّر كلمة المرور بشكل دوري</li>
            <li>✅ تحقق من سجل الأحداث بانتظام</li>
            <li>✅ لا تستخدم نفس كلمة المرور في مواقع أخرى</li>
            <li>✅ سجّل الخروج من الأجهزة العامة</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export default SecuritySettings;
