import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile } from '../utils/supabase';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaUserTie, FaLock, FaEye, FaEyeSlash, FaCamera, FaImage, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { 
  validateEgyptianID, 
  validateEmail, 
  validateEgyptianPhone, 
  validateArabicName,
  validatePasswordStrength,
  sanitizeInput,
  validateFileUpload,
  hashPassword,
  detectAttackPatterns
} from '../utils/security';
import securityLogger from '../utils/securityLogger';
import '../styles/Auth.css';

function RegistrationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: '/images/yly-logo.jpg',
      title: 'انضم إلى YLY',
      subtitle: 'Your Life Your Story',
      description: 'سجل الآن وكن جزءاً من مجتمعنا المتميز'
    },
    {
      image: '/images/auth-visual-3.jpg',
      title: 'طور مهاراتك',
      subtitle: 'نمو مستمر',
      description: 'اكتسب خبرات جديدة وطور قدراتك مع فريقنا'
    },
    {
      image: '/images/auth-visual-2.jpeg',
      title: 'حقق إنجازاتك',
      subtitle: 'نجاحات مشتركة',
      description: 'ابدأ رحلتك نحو النجاح والتميز معنا'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [idCardPhoto, setIdCardPhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [idCardPhotoPreview, setIdCardPhotoPreview] = useState(null);

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ];

  const committees = ['PR', 'HR', 'R&D', 'Social Media', 'OR', 'Training'];
  const roles = ['Head', 'Vice Head', 'Team Leader', 'Vice Team Leader', 'Member'];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, level: '', errors: [] });

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
      });
      
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      if (type === 'profile') {
        setProfilePhoto(file);
        setProfilePhotoPreview(URL.createObjectURL(file));
      } else if (type === 'idCard') {
        setIdCardPhoto(file);
        setIdCardPhotoPreview(URL.createObjectURL(file));
      }
      setError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For name field, allow Arabic letters and spaces without sanitization
    if (name === 'name') {
      const arabicOnly = /^[\u0600-\u06FF\s]*$/;
      if (!arabicOnly.test(value)) {
        return;
      }
      setFormData({
        ...formData,
        [name]: value
      });
      setError('');
      setSuccess('');
      return;
    }
    
    // Sanitize input for other fields
    let sanitizedValue = sanitizeInput(value);
    
    const attackCheck = detectAttackPatterns(sanitizedValue);
    if (attackCheck.detected) {
      console.warn(`Attack detected in ${name}: ${attackCheck.type}`);
      setError(`تم اكتشاف محاولة غير صالحة في حقل ${name === 'name' ? 'الاسم' : name}`);
      return;
    }
    
    if (name === 'id') {
      const numbersOnly = /^[0-9]*$/;
      if (!numbersOnly.test(sanitizedValue) || sanitizedValue.length > 14) {
        return;
      }
    }
    
    if (name === 'password') {
      const strength = validatePasswordStrength(sanitizedValue);
      setPasswordStrength(strength);
    }
    
    setFormData({
      ...formData,
      [name]: sanitizedValue
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

    if (!profilePhoto) {
      setError('الرجاء إضافة صورة شخصية');
      setLoading(false);
      return;
    }

    if (!idCardPhoto) {
      setError('الرجاء إضافة صورة البطاقة الشخصية');
      setLoading(false);
      return;
    }

    const nameValidation = validateArabicName(formData.name);
    if (!nameValidation.valid) {
      setError(nameValidation.error);
      setLoading(false);
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      setLoading(false);
      return;
    }

    const phoneValidation = validateEgyptianPhone(formData.number);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error);
      setLoading(false);
      return;
    }

    const idValidation = validateEgyptianID(formData.id);
    if (!idValidation.valid) {
      setError(idValidation.error);
      setLoading(false);
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.valid) {
      setError('كلمة المرور ضعيفة: ' + passwordValidation.errors[0]);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      setLoading(false);
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      
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

      setSuccess('جاري رفع الصور...');
      
      const profileUploadResult = await uploadFile(
        profilePhoto,
        'user-images',
        `profiles/${formData.id}`
      );
      
      if (!profileUploadResult.success) {
        setError(`خطأ في رفع الصورة الشخصية: ${profileUploadResult.error}`);
        setLoading(false);
        return;
      }
      
      const idCardUploadResult = await uploadFile(
        idCardPhoto,
        'user-images',
        `id-cards/${formData.id}`
      );
      
      if (!idCardUploadResult.success) {
        setError(`خطأ في رفع صورة البطاقة: ${idCardUploadResult.error}`);
        setLoading(false);
        return;
      }

      setSuccess('جاري حفظ البيانات...');
      await addDoc(collection(db, 'pending_registrations'), {
        name: formData.name,
        email: formData.email,
        number: phoneValidation.cleanPhone || formData.number,
        userId: formData.id,
        governorate: formData.governorate,
        university: formData.university,
        committee: formData.committee,
        role: formData.role,
        password: formData.password,
        passwordHash: hashedPassword,
        profilePhotoURL: profileUploadResult.url,
        idCardPhotoURL: idCardUploadResult.url,
        status: 'pending',
        createdAt: new Date().toISOString(),
        securityVersion: '1.0'
      });

      securityLogger.logRegistration(formData.id, formData.email);
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

  return (
    <div className="auth-page-glass">
      <motion.div 
        className="auth-glass-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '1200px' }}
      >
        {/* Left Side - Visual/Branding */}
        <motion.div 
          className="auth-visual-side"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
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
          style={{ overflowY: 'auto', maxHeight: '90vh' }}
        >
          <div className="form-content">
            <div className="form-header-glass">
              <h2>إنشاء حساب جديد</h2>
            </div>

            {error && (
              <motion.div 
                className="glass-alert glass-alert-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                className="glass-alert glass-alert-success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="glass-form">
              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaUser className="glass-input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="الاسم الكامل (بالعربي فقط)"
                    disabled={loading}
                    dir="rtl"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaEnvelope className="glass-input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="البريد الإلكتروني"
                    disabled={loading}
                    dir="ltr"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaPhone className="glass-input-icon" />
                  <input
                    type="tel"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="رقم الهاتف"
                    disabled={loading}
                    dir="ltr"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaIdCard className="glass-input-icon" />
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    placeholder="رقم الهوية (14 رقم)"
                    disabled={loading}
                    maxLength="14"
                    dir="ltr"
                    className="glass-input"
                  />
                </div>
                {formData.id && (
                  <div className="glass-feedback">
                    {formData.id.length === 14 ? (
                      <span className="feedback-ok">✓ رقم صحيح</span>
                    ) : (
                      <span className="feedback-warn">متبقي {14 - formData.id.length} رقم</span>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-input-group">
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'profile')}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="profilePhoto"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '2px dashed #2d3748',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: profilePhotoPreview ? '#23283a' : '#1a1d29'
                  }}
                >
                  {profilePhotoPreview ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={profilePhotoPreview} 
                        alt="Profile Preview" 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          marginBottom: '10px',
                          border: '3px solid #5b6ee1'
                        }} 
                      />
                      <p style={{ color: '#5b6ee1', fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>
                        ✓ تم اختيار الصورة الشخصية
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <FaCamera style={{ fontSize: '2rem', color: '#64748b', marginBottom: '10px' }} />
                      <p style={{ color: '#cbd5e1', fontWeight: '600', margin: 0 }}>
                        اضغط لاختيار صورة شخصية
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="glass-input-group">
                <input
                  type="file"
                  id="idCardPhoto"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'idCard')}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="idCardPhoto"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '2px dashed #2d3748',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: idCardPhotoPreview ? '#23283a' : '#1a1d29'
                  }}
                >
                  {idCardPhotoPreview ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={idCardPhotoPreview} 
                        alt="ID Card Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '150px', 
                          borderRadius: '12px', 
                          objectFit: 'contain',
                          marginBottom: '10px',
                          border: '2px solid #5b6ee1'
                        }} 
                      />
                      <p style={{ color: '#5b6ee1', fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>
                        ✓ تم اختيار صورة البطاقة
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <FaImage style={{ fontSize: '2rem', color: '#64748b', marginBottom: '10px' }} />
                      <p style={{ color: '#cbd5e1', fontWeight: '600', margin: 0 }}>
                        اضغط لاختيار صورة البطاقة
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaMapMarkerAlt className="glass-input-icon" />
                  <select
                    name="governorate"
                    value={formData.governorate}
                    onChange={handleChange}
                    disabled={loading}
                    className="glass-input"
                    style={{ paddingRight: '50px' }}
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaUsers className="glass-input-icon" />
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="الكلية / الجامعة"
                    disabled={loading}
                    dir="rtl"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaUsers className="glass-input-icon" />
                  <select
                    name="committee"
                    value={formData.committee}
                    onChange={handleChange}
                    disabled={loading}
                    className="glass-input"
                    style={{ paddingRight: '50px' }}
                  >
                    <option value="">اختر اللجنة</option>
                    {committees.map((committee) => (
                      <option key={committee} value={committee}>
                        {committee}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaUserTie className="glass-input-icon" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                    className="glass-input"
                    style={{ paddingRight: '50px' }}
                  >
                    <option value="">اختر الدور</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaLock className="glass-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="كلمة المرور (8 أحرف على الأقل)"
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
                {formData.password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: passwordStrength.strength >= (level * 20) 
                              ? passwordStrength.strength < 40 ? '#ef4444' 
                              : passwordStrength.strength < 70 ? '#f59e0b' 
                              : '#34d399'
                              : '#2d3748',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </div>
                    {passwordStrength.level && (
                      <div className="glass-feedback">
                        <span style={{ 
                          color: passwordStrength.strength < 40 ? '#ef4444' 
                            : passwordStrength.strength < 70 ? '#f59e0b' 
                            : '#34d399'
                        }}>
                          {passwordStrength.level}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-input-group">
                <div className="glass-input-wrapper">
                  <FaLock className="glass-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="تأكيد كلمة المرور"
                    disabled={loading}
                    dir="ltr"
                    className="glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="glass-toggle-btn"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && (
                  <div className="glass-feedback">
                    {formData.password === formData.confirmPassword ? (
                      <span className="feedback-ok">✓ كلمة المرور متطابقة</span>
                    ) : (
                      <span className="feedback-warn">كلمة المرور غير متطابقة</span>
                    )}
                  </div>
                )}
              </div>

              <motion.button 
                type="submit" 
                className="glass-submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="glass-spinner"></span>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>تسجيل الآن</span>
                  </>
                )}
              </motion.button>

              <div className="glass-footer">
                <p>لديك حساب بالفعل؟</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="glass-link-btn"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default RegistrationForm;
