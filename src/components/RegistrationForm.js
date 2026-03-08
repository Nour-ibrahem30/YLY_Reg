import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaUserTie, FaArrowLeft, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function RegistrationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    number: '',
    id: location.state?.userId || '',
    governorate: '',
    university: '',
    committee: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  const governorates = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'البحر الأحمر',
    'البحيرة',
    'الفيوم',
    'الغربية',
    'الإسماعيلية',
    'المنوفية',
    'المنيا',
    'القليوبية',
    'الوادي الجديد',
    'الشرقية',
    'السويس',
    'أسوان',
    'أسيوط',
    'بني سويف',
    'بورسعيد',
    'دمياط',
    'الأقصر',
    'قنا',
    'كفر الشيخ',
    'مطروح',
    'شمال سيناء',
    'جنوب سيناء',
    'سوهاج'
  ];

  const committees = [
    'PR',
    'HR',
    'R&D',
    'Social Media',
    'OR'
  ];

  const roles = [
    'Head',
    'Vice Head',
    'Team Leader',
    'Vice Team Leader',
    'Member'
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // دالة للتحقق من وجود تسجيل سابق
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation للاسم - عربي فقط
    if (name === 'name') {
      const arabicOnly = /^[\u0600-\u06FF\s]*$/;
      if (!arabicOnly.test(value)) {
        return; // منع إدخال أي حروف غير عربية
      }
    }
    
    // Validation لرقم الهوية - أرقام فقط وماكسيمم 14 رقم
    if (name === 'id') {
      const numbersOnly = /^[0-9]*$/;
      if (!numbersOnly.test(value) || value.length > 14) {
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.number || !formData.id || !formData.governorate || !formData.committee || !formData.password) {
      setError('الرجاء ملء جميع الحقول');
      setLoading(false);
      return;
    }

    // التحقق من كلمة المرور
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      setLoading(false);
      return;
    }

    // التحقق من أن الاسم عربي فقط
    const arabicOnly = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnly.test(formData.name)) {
      setError('الرجاء إدخال الاسم بالعربي فقط');
      setLoading(false);
      return;
    }

    // التحقق من رقم الهوية (14 رقم)
    if (formData.id.length !== 14) {
      setError('رقم الهوية يجب أن يكون 14 رقم');
      setLoading(false);
      return;
    }

    try {
      // التحقق من التكرار في pending_registrations
      const pendingQ = query(
        collection(db, 'pending_registrations'),
        where('userId', '==', formData.id)
      );
      const pendingSnapshot = await getDocs(pendingQ);
      
      if (!pendingSnapshot.empty) {
        setError('رقم الهوية هذا مسجل بالفعل وفي انتظار الموافقة.');
        setLoading(false);
        return;
      }

      // التحقق من التكرار في users (المستخدمين المعتمدين)
      const usersQ = query(
        collection(db, 'users'),
        where('userId', '==', formData.id)
      );
      const usersSnapshot = await getDocs(usersQ);
      
      if (!usersSnapshot.empty) {
        setError('رقم الهوية هذا مسجل بالفعل ومعتمد. يمكنك تسجيل الدخول.');
        setLoading(false);
        return;
      }

      // إضافة المستخدم في pending_registrations
      const docRef = await addDoc(collection(db, 'pending_registrations'), {
        name: formData.name,
        email: formData.email,
        number: formData.number,
        userId: formData.id,
        governorate: formData.governorate,
        committee: formData.committee,
        role: formData.role,
        password: formData.password,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSuccess('تم التسجيل بنجاح! في انتظار موافقة الإدارة.');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      console.error('Error adding document: ', err);
      setError('حدث خطأ أثناء التسجيل. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
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
          <p>انضم إلى مجتمعنا وكن جزءاً من القصة</p>
          
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>تسجيل سريع وآمن</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>ملف شخصي مخصص</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <span>QR Code فريد لكل عضو</span>
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
        <motion.div className="header" variants={itemVariants}>
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
          <h1>انضم إلى مجتمعنا</h1>
          <p>Your Life Your Story</p>
        </motion.div>

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="name">
              <FaUser className="input-icon" />
              الاسم الكامل (بالعربي فقط)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="أدخل اسمك الكامل بالعربي"
              disabled={loading}
              dir="rtl"
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              disabled={loading}
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="number">
              <FaPhone className="input-icon" />
              رقم الهاتف
            </label>
            <input
              type="tel"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              placeholder="+20 123 456 7890"
              disabled={loading}
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="id">
              <FaIdCard className="input-icon" />
              رقم الهوية (14 رقم)
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="أدخل رقم الهوية (14 رقم)"
              disabled={loading}
              maxLength="14"
              dir="ltr"
            />
            {formData.id && formData.id.length < 14 && (
              <small style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                متبقي {14 - formData.id.length} رقم
              </small>
            )}
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="governorate">
              <FaMapMarkerAlt className="input-icon" />
              المحافظة
            </label>
            <select
              id="governorate"
              name="governorate"
              value={formData.governorate}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="university">
              <FaUsers className="input-icon" />
              الكلية / الجامعة
            </label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="مثال: كلية الهندسة - جامعة القاهرة"
              disabled={loading}
              dir="rtl"
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="committee">
              <FaUsers className="input-icon" />
              اللجنة
            </label>
            <select
              id="committee"
              name="committee"
              value={formData.committee}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">اختر اللجنة</option>
              {committees.map((committee) => (
                <option key={committee} value={committee}>
                  {committee}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="role">
              <FaUserTie className="input-icon" />
              الدور الوظيفي
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">اختر الدور</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="password">
              <FaLock className="input-icon" />
              كلمة المرور (6 أحرف على الأقل)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
                dir="ltr"
                style={{ paddingLeft: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '1.1rem',
                  padding: '5px'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="confirmPassword">
              <FaLock className="input-icon" />
              تأكيد كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="أعد إدخال كلمة المرور"
                disabled={loading}
                dir="ltr"
                style={{ paddingLeft: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '1.1rem',
                  padding: '5px'
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <small style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                كلمة المرور غير متطابقة
              </small>
            )}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <small style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                ✓ كلمة المرور متطابقة
              </small>
            )}
          </motion.div>

          <motion.button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              'تسجيل الآن'
            )}
          </motion.button>
        </form>
        </div>
      </motion.div>
    </div>
  );
}

export default RegistrationForm;
