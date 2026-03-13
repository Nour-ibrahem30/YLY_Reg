import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { FaCamera, FaShieldAlt, FaUserShield, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import {
  loadModels,
  verifyAdminFace,
  registerAdminFace,
  isAdminFaceRegistered
} from '../services/faceRecognitionService';
import '../styles/FaceRecognitionLogin.css';

function FaceRecognitionLogin() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    initializeFaceRecognition();
  }, []);

  const initializeFaceRecognition = async () => {
    try {
      setMessage('جاري تحميل نماذج التعرف على الوجه...');
      setMessageType('info');

      // Load face-api models
      const loaded = await loadModels();
      
      if (!loaded) {
        setMessage('فشل تحميل نماذج التعرف على الوجه');
        setMessageType('error');
        setLoading(false);
        return;
      }

      setModelsLoaded(true);
      setMessage('جاري التحقق من قاعدة البيانات...');

      // Check if admin face is registered
      try {
        const isRegistered = await isAdminFaceRegistered();
        console.log('Admin face registered:', isRegistered);
        setNeedsRegistration(!isRegistered);

        if (isRegistered) {
          setMessage('✓ تم العثور على وجه مسجل. ضع وجهك أمام الكاميرا للتحقق');
          setMessageType('success');
        } else {
          setMessage('⚠️ لا يوجد وجه مسجل. يرجى تسجيل وجه الأدمن أولاً');
          setMessageType('info');
        }
      } catch (dbError) {
        console.error('Database check error:', dbError);
        // If there's an error checking the database, assume no registration
        setNeedsRegistration(true);
        setMessage('⚠️ لا يوجد وجه مسجل. يرجى تسجيل وجه الأدمن أولاً');
        setMessageType('info');
      }

      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setMessage('حدث خطأ أثناء التهيئة');
      setMessageType('error');
      setLoading(false);
    }
  };

  const captureAndVerify = async () => {
    if (!webcamRef.current || capturing) return;

    try {
      setCapturing(true);
      setMessage('جاري التقاط الصورة...');
      setMessageType('info');

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
      setMessage('جاري التحقق من الوجه...');

      // Verify face
      const result = await verifyAdminFace(imageSrc);

      if (result.success) {
        setMessage(`✓ ${result.message} - جاري تسجيل الدخول...`);
        setMessageType('success');

        // Store session
        sessionStorage.setItem('admin_face_session', JSON.stringify({
          adminName: result.adminName,
          authenticatedAt: new Date().toISOString(),
          confidence: result.confidence
        }));

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        if (result.needsRegistration) {
          setNeedsRegistration(true);
          setMessage('⚠️ لا يوجد وجه مسجل. يرجى التسجيل أولاً');
        } else {
          setMessage('✗ وجه غير مصرح له! تم تسجيل المحاولة');
        }
        setMessageType('error');
        setCapturedImage(null);
        setCapturing(false);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setMessage(error.message || 'حدث خطأ أثناء التحقق');
      setMessageType('error');
      setCapturedImage(null);
      setCapturing(false);
    }
  };

  const handleRegisterFace = async (e) => {
    e.preventDefault();
    
    if (!adminName.trim()) {
      setMessage('⚠️ يرجى إدخال اسم الأدمن');
      setMessageType('error');
      return;
    }

    if (!webcamRef.current) {
      setMessage('⚠️ الكاميرا غير متاحة');
      setMessageType('error');
      return;
    }

    try {
      setCapturing(true);
      setMessage('جاري التقاط صورة التسجيل...');
      setMessageType('info');

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
      setMessage('جاري تسجيل الوجه في قاعدة البيانات...');

      // Register face
      await registerAdminFace(imageSrc, adminName);

      setMessage('✓ تم تسجيل وجه الأدمن بنجاح!');
      setMessageType('success');
      setNeedsRegistration(false);
      setShowRegistrationForm(false);
      setAdminName('');

      setTimeout(() => {
        setCapturedImage(null);
        setCapturing(false);
        setMessage('✓ يمكنك الآن تسجيل الدخول. ضع وجهك أمام الكاميرا للتحقق');
        setMessageType('success');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'حدث خطأ أثناء التسجيل');
      setMessageType('error');
      setCapturedImage(null);
      setCapturing(false);
    }
  };

  if (loading) {
    return (
      <div className="face-recognition-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>جاري تحميل نظام التعرف على الوجه...</p>
        </div>
      </div>
    );
  }

  if (!modelsLoaded) {
    return (
      <div className="face-recognition-page">
        <div className="error-container">
          <FaTimesCircle className="error-icon" />
          <h2>فشل تحميل نظام التعرف على الوجه</h2>
          <p>يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="face-recognition-page">
      <motion.div
        className="face-recognition-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Header */}
        <div className="face-header">
          <div className="face-logo">
            <FaUserShield />
          </div>
          <h1>التحقق من هوية الأدمن</h1>
          <p>نظام التعرف على الوجه</p>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              className={`face-message face-message-${messageType}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {messageType === 'success' && <FaCheckCircle />}
              {messageType === 'error' && <FaTimesCircle />}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Webcam Container */}
        <div className="webcam-container">
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
            <img src={capturedImage} alt="Captured" className="captured-image" />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="webcam"
              mirrored={true}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user'
              }}
            />
          )}

          <div className="face-overlay">
            <div className="face-frame"></div>
          </div>
        </div>

        {/* Actions */}
        {!showRegistrationForm ? (
          <div className="face-actions">
            {needsRegistration ? (
              <motion.button
                className="register-btn"
                onClick={() => setShowRegistrationForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={capturing}
              >
                <FaShieldAlt />
                <span>تسجيل وجه الأدمن</span>
              </motion.button>
            ) : (
              <motion.button
                className="verify-btn"
                onClick={captureAndVerify}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={capturing}
              >
                {capturing ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <FaCamera />
                    <span>التحقق من الوجه</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        ) : (
          <motion.form
            className="registration-form"
            onSubmit={handleRegisterFace}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="form-group">
              <label>اسم الأدمن</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="أدخل اسم الأدمن"
                required
                disabled={capturing}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={capturing}
              >
                {capturing ? <span className="spinner"></span> : 'تسجيل الوجه'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowRegistrationForm(false);
                  setAdminName('');
                }}
                disabled={capturing}
              >
                إلغاء
              </button>
            </div>
          </motion.form>
        )}

        {/* Footer */}
        <div className="face-footer">
          <p>🔒 محمي بتقنية التعرف على الوجه المتقدمة</p>
          <p className="privacy-note">
            جميع محاولات الدخول غير المصرح بها يتم تسجيلها تلقائياً
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default FaceRecognitionLogin;
