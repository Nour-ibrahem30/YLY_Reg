import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaIdCard, FaUser, FaSignInAlt, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { 
  validateEgyptianID, 
  sanitizeInput, 
  checkRateLimit,
  hashPassword,
  detectAttackPatterns 
} from '../utils/security';
import securityLogger from '../utils/securityLogger';
import twoFactorAuth from '../utils/twoFactorAuth';
import TwoFactorModal from './TwoFactorModal';
import '../styles/Auth.css';
import '../styles/ModernTheme.css';

function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: '/images/yly-logo.jpg',
      title: 'مرحباً بك في YLY',
      subtitle: 'Your Life Your Story',
      description: 'انضم إلى مجتمعنا وابدأ رحلتك في تحقيق أهدافك'
    },
    {
      image: '/images/auth-visual-3.jpg',
      title: 'تطوير المهارات',
      subtitle: 'نمو مستمر',
      description: 'طور مهاراتك واكتسب خبرات جديدة مع فريقنا'
    },
    {
      image: '/images/auth-visual-2.jpeg',
      title: 'إنجازات متميزة',
      subtitle: 'نجاحات مشتركة',
      description: 'كن جزءاً من قصص النجاح والإنجازات المتميزة'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Rate Limiting Check
    const rateLimitCheck = checkRateLimit('login_attempts', 5, 15 * 60 * 1000);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message);
      setLoading(false);
      return;
    }

    // 2. Sanitize inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedPassword = sanitizeInput(password);

    // 3. Validate Egyptian ID
    const idValidation = validateEgyptianID(sanitizedUserId);
    if (!idValidation.valid) {
      setError(idValidation.error);
      setLoading(false);
      return;
    }

    // 4. Password length check
    if (!sanitizedPassword || sanitizedPassword.length < 6) {
      setError('الرجاء إدخال كلمة المرور (6 أحرف على الأقل)');
      setLoading(false);
      return;
    }

    // 5. Detect attack patterns
    const attackCheck = detectAttackPatterns(sanitizedUserId + sanitizedPassword);
    if (attackCheck.detected) {
      console.warn(`Attack detected: ${attackCheck.type}`);
      setError('تم اكتشاف محاولة غير صالحة. الرجاء المحاولة مرة أخرى.');
      setLoading(false);
      return;
    }

    try {
      // 6. Hash password for comparison
      const hashedPassword = await hashPassword(sanitizedPassword);

      // البحث في users (المستخدمين المعتمدين)
      const usersQ = query(
        collection(db, 'users'),
        where('userId', '==', sanitizedUserId)
      );
      const usersSnapshot = await getDocs(usersQ);

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const userDocId = usersSnapshot.docs[0].id;
        
        // التحقق من كلمة المرور (مع دعم plain text للمستخدمين القدامى)
        const passwordMatch = userData.password === sanitizedPassword || 
                             userData.passwordHash === hashedPassword;
        
        if (passwordMatch) {
          // Check if 2FA is enabled
          if (twoFactorAuth.is2FAEnabled(sanitizedUserId)) {
            // Generate and send 2FA code
            const code = twoFactorAuth.generateCode();
            twoFactorAuth.storeCode(sanitizedUserId, code);
            
            // Send code via email (in production, this would actually send an email)
            await twoFactorAuth.sendCodeViaEmail(sanitizedUserId, userData.email, code);
            
            // Store user data for after verification
            setPendingUserData({
              userId: sanitizedUserId,
              governorate: userData.governorate,
              userDocId: userDocId,
              email: userData.email,
              phone: userData.number
            });
            
            // Show 2FA modal
            setShow2FAModal(true);
            setLoading(false);
            return;
          }
          
          // تسجيل دخول ناجح - التوجيه للـ Dashboard
          console.log('✅ Login successful');
          securityLogger.logLoginAttempt(sanitizedUserId, true);
          
          // Store user data in sessionStorage for Dashboard
          sessionStorage.setItem('currentUser', JSON.stringify({
            userId: sanitizedUserId,
            governorate: userData.governorate,
            userDocId: userDocId,
            name: userData.name,
            email: userData.email,
            phone: userData.number,
            committee: userData.committee,
            points: userData.points || 0
          }));
          
          navigate('/dashboard');
          return;
        } else {
          securityLogger.logLoginAttempt(sanitizedUserId, false);
          setError('كلمة المرور غير صحيحة');
          setLoading(false);
          return;
        }
      }
      
      // إذا لم يتم العثور على المستخدم في users، تحقق من pending_registrations
      const pendingQ = query(
        collection(db, 'pending_registrations'),
        where('userId', '==', sanitizedUserId)
      );
      const pendingSnapshot = await getDocs(pendingQ);

      if (!pendingSnapshot.empty) {
        setError('حسابك في انتظار موافقة الإدارة. سيتم إعلامك عند الموافقة.');
        setLoading(false);
        return;
      }
      
      // المستخدم غير موجود - توجيه للتسجيل
      setError('رقم الهوية غير مسجل. سيتم توجيهك لصفحة التسجيل...');
      setTimeout(() => {
        navigate('/register', { state: { userId: sanitizedUserId } });
      }, 1500);
    } catch (err) {
      console.error('Error during login:', err);
      setError('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification success
  const handle2FAVerified = () => {
    if (pendingUserData) {
      console.log('✅ 2FA verified, login successful');
      securityLogger.logLoginAttempt(userId, true);
      
      // Store user data in sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify({
        userId: pendingUserData.userId,
        governorate: pendingUserData.governorate,
        userDocId: pendingUserData.userDocId,
        email: pendingUserData.email,
        phone: pendingUserData.phone
      }));
      
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page-glass">
      {/* Main Container */}
      <motion.div 
        className="auth-glass-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left Side - Visual/Branding */}
        <motion.div 
          className="auth-visual-side"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Slider Images */}
          <div className="visual-slider">
            {slides.map((slide, index) => (
              <motion.div
                key={index}
                className={`slide-item ${index === currentSlide ? 'active' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: index === currentSlide ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="slide-bg-image">
                  <img src={slide.image} alt={slide.title} />
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="visual-content">
            {/* Animated Circles with Icons */}
            <div className="orbit-container">
              <motion.div 
                className="center-logo"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <img 
                  src="/images/yly-logo.jpg" 
                  alt="YLY Logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="logo-text-fallback" style={{ display: 'none' }}>YLY</div>
              </motion.div>

              {/* Orbiting Icons */}
              <motion.div 
                className="orbit-icon orbit-1"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <div className="icon-circle icon-user">
                  <FaUser />
                </div>
              </motion.div>

              <motion.div 
                className="orbit-icon orbit-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <div className="icon-circle icon-trophy">
                  <FaTrophy />
                </div>
              </motion.div>

              <motion.div 
                className="orbit-icon orbit-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              >
                <div className="icon-circle icon-shield">
                  <FaShieldAlt />
                </div>
              </motion.div>

              <motion.div 
                className="orbit-icon orbit-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                <div className="icon-circle icon-lock">
                  <FaLock />
                </div>
              </motion.div>
            </div>

            {/* Text Content */}
            <div className="visual-text">
              <motion.h2
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {slides[currentSlide].title}
              </motion.h2>
              <motion.p
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {slides[currentSlide].subtitle}
              </motion.p>
              <motion.p 
                className="visual-description"
                key={`desc-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {slides[currentSlide].description}
              </motion.p>
            </div>

            {/* Dots Indicator */}
            <div className="dots-indicator">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div 
          className="auth-form-side"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="form-content">
            <div className="form-header-glass">
              <h2>تسجيل الدخول</h2>
            </div>

            {error && (
              <motion.div 
                className={`glass-alert ${error.includes('غير مسجل') ? 'glass-alert-success' : 'glass-alert-error'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="glass-form">
              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaIdCard className="glass-input-icon" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 14) {
                        setUserId(value);
                        setError('');
                      }
                    }}
                    placeholder="رقم الهوية (14 رقم)"
                    disabled={loading}
                    maxLength="14"
                    dir="ltr"
                    autoFocus
                    className="glass-input"
                  />
                </div>
                {userId && (
                  <div className="glass-feedback">
                    {userId.length === 14 ? (
                      <span className="feedback-ok">✓ رقم صحيح</span>
                    ) : (
                      <span className="feedback-warn">متبقي {14 - userId.length} رقم</span>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaLock className="glass-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="كلمة المرور"
                    disabled={loading}
                    dir="ltr"
                    className="glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="glass-toggle-btn"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {password && password.length < 6 && (
                  <div className="glass-feedback">
                    <span className="feedback-warn">6 أحرف على الأقل</span>
                  </div>
                )}
              </div>

              <motion.button 
                type="submit" 
                className="glass-submit-btn"
                disabled={loading || userId.length !== 14 || password.length < 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="glass-spinner"></span>
                ) : (
                  <>
                    <FaSignInAlt />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </motion.button>

              <div className="glass-footer">
                <p>ليس لديك حساب؟</p>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="glass-link-btn"
                >
                  إنشاء حساب جديد
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setLoading(false);
          setPendingUserData(null);
        }}
        userId={userId}
        email={pendingUserData?.email}
        onVerified={handle2FAVerified}
      />
    </div>
  );
}

export default Login;
