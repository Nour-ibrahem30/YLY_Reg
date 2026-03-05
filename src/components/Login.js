import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaIdCard, FaUser, FaSignInAlt } from 'react-icons/fa';

function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userId || userId.length !== 14) {
      setError('الرجاء إدخال رقم الهوية (14 رقم)');
      setLoading(false);
      return;
    }

    try {
      // البحث في كل المحافظات
      let userFound = false;
      let userGovernorate = '';
      let userDocId = '';

      for (const gov of governorates) {
        const q = query(
          collection(db, gov),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          userFound = true;
          userGovernorate = gov;
          userDocId = querySnapshot.docs[0].id;
          break;
        }
      }

      if (userFound) {
        // المستخدم موجود - توجيه للبروفايل
        navigate(`/profile/${userGovernorate}/${userDocId}`);
      } else {
        // المستخدم غير موجود - توجيه للتسجيل
        setError('رقم الهوية غير مسجل. سيتم توجيهك لصفحة التسجيل...');
        setTimeout(() => {
          navigate('/register', { state: { userId } });
        }, 2000);
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <motion.div 
        className="brand-section"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="brand-content">
          <motion.div 
            className="brand-logo"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <img 
              src="/yly-logo.png" 
              alt="YLY Logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="brand-logo-text" style={{ display: 'none' }}>YLY</span>
          </motion.div>
          <h1>مرحباً بك في YLY</h1>
          <p>Your Life Your Story</p>
          <p>سجل دخولك للوصول إلى حسابك</p>
          
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>دخول سريع وآمن</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>الوصول لملفك الشخصي</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>متابعة نقاطك ومهامك</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="form-section"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <motion.div className="header">
            <div className="logo-container">
              <motion.div 
                className="logo"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                YLY
              </motion.div>
            </div>
            <h1>تسجيل الدخول</h1>
            <p>أدخل رقم الهوية للدخول إلى حسابك</p>
          </motion.div>

          {error && (
            <motion.div 
              className={`${error.includes('غير مسجل') ? 'success-message' : 'error-message'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin}>
            <motion.div 
              className="form-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label htmlFor="userId">
                <FaIdCard className="input-icon" />
                رقم الهوية (14 رقم)
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={userId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 14) {
                    setUserId(value);
                    setError('');
                  }
                }}
                placeholder="أدخل رقم الهوية"
                disabled={loading}
                maxLength="14"
                dir="ltr"
                autoFocus
              />
              {userId && userId.length < 14 && (
                <small style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                  متبقي {14 - userId.length} رقم
                </small>
              )}
              {userId && userId.length === 14 && (
                <small style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                  ✓ رقم الهوية صحيح
                </small>
              )}
            </motion.div>

            <motion.button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || userId.length !== 14}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <FaSignInAlt style={{ marginLeft: '8px' }} />
                  تسجيل الدخول
                </>
              )}
            </motion.button>

            <motion.div 
              style={{ 
                textAlign: 'center', 
                marginTop: '30px',
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '12px'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p style={{ color: '#6b7280', marginBottom: '15px' }}>
                ليس لديك حساب؟
              </p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                  padding: '12px 30px',
                  background: 'white',
                  color: '#0066ff',
                  border: '2px solid #0066ff',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0066ff';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#0066ff';
                }}
              >
                <FaUser />
                إنشاء حساب جديد
              </button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
