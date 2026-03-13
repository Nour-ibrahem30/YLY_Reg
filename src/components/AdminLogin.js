import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFingerprint, FaShieldAlt, FaLock, FaUser, FaKey } from 'react-icons/fa';
import { 
  isBiometricAvailable, 
  isBiometricRegistered, 
  registerBiometric, 
  authenticateBiometric,
  isAuthenticated 
} from '../utils/biometricAuth';
import '../styles/AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');

  // Admin credentials (في الإنتاج، يجب أن تكون في قاعدة البيانات)
  const ADMIN_PASSWORD = 'YLY@Admin2024';

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated()) {
      navigate('/admin/dashboard');
      return;
    }

    // Check biometric support
    setBiometricSupported(isBiometricAvailable());
    setBiometricRegistered(isBiometricRegistered());
  }, [navigate]);

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await authenticateBiometric();
      setSuccess('تم تسجيل الدخول بنجاح!');
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'فشلت المصادقة البيومترية');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupBiometric = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Verify admin password
    if (setupPassword !== ADMIN_PASSWORD) {
      setError('كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    try {
      // Use fixed admin credentials
      await registerBiometric('admin', 'YLY Admin');
      setSuccess('تم تسجيل المصادقة البيومترية بنجاح!');
      setBiometricRegistered(true);
      setShowSetup(false);
      setSetupPassword('');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'فشل تسجيل المصادقة البيومترية');
    } finally {
      setLoading(false);
    }
  };

  if (!biometricSupported) {
    return (
      <div className="admin-login-page">
        <motion.div 
          className="admin-login-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="not-supported">
            <FaLock className="not-supported-icon" />
            <h2>المصادقة البيومترية غير مدعومة</h2>
            <p>متصفحك أو جهازك لا يدعم المصادقة البيومترية (Face ID / Touch ID / Fingerprint)</p>
            <p>الرجاء استخدام متصفح حديث أو جهاز يدعم هذه الميزة</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <motion.div 
        className="admin-login-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="admin-login-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-logo">
            <FaShieldAlt />
          </div>
          <h1>لوحة تحكم الأدمن</h1>
          <p>تسجيل الدخول الآمن</p>
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div 
            className="alert alert-error"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="alert alert-success"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {success}
          </motion.div>
        )}

        {/* Main Content */}
        {!showSetup ? (
          <motion.div 
            className="admin-login-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {biometricRegistered ? (
              <>
                <div className="biometric-icon-container">
                  <motion.div
                    className="biometric-icon"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <FaFingerprint />
                  </motion.div>
                </div>

                <h2>استخدم Face ID أو Touch ID</h2>
                <p>اضغط على الزر للمصادقة باستخدام البصمة البيومترية</p>

                <motion.button
                  className="biometric-btn"
                  onClick={handleBiometricAuth}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <span className="spinner"></span>
                  ) : (
                    <>
                      <FaFingerprint />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </motion.button>

                <button 
                  className="setup-link"
                  onClick={() => setShowSetup(true)}
                >
                  إعادة تسجيل المصادقة البيومترية
                </button>
              </>
            ) : (
              <>
                <div className="setup-icon-container">
                  <FaKey className="setup-icon" />
                </div>

                <h2>تسجيل المصادقة البيومترية</h2>
                <p>يجب تسجيل Face ID أو Touch ID أولاً للوصول إلى لوحة التحكم</p>

                <motion.button
                  className="setup-btn"
                  onClick={() => setShowSetup(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaShieldAlt />
                  <span>تسجيل الآن</span>
                </motion.button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="admin-setup-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2>إعداد المصادقة البيومترية</h2>
            <p>أدخل كلمة مرور الأدمن للتحقق وتفعيل Face ID / Touch ID</p>

            <form onSubmit={handleSetupBiometric}>
              <div className="form-group">
                <label>
                  <FaLock />
                  <span>كلمة مرور الأدمن</span>
                </label>
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور الأدمن"
                  required
                  disabled={loading}
                  autoFocus
                />
                <p style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  marginTop: '8px',
                  marginBottom: 0
                }}>
                  💡 كلمة المرور الافتراضية: YLY@Admin2024
                </p>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? <span className="spinner"></span> : 'تفعيل Face ID'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowSetup(false);
                    setSetupPassword('');
                  }}
                  disabled={loading}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div 
          className="admin-login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>🔒 محمي بتقنية المصادقة البيومترية</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
