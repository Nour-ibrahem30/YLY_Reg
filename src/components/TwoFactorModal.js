import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaTimes, FaClock, FaEnvelope, FaRedo } from 'react-icons/fa';
import twoFactorAuth from '../utils/twoFactorAuth';
import '../styles/TwoFactorModal.css';

function TwoFactorModal({ isOpen, onClose, userId, email, onVerified }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingTime, setRemainingTime] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [displayCode, setDisplayCode] = useState(''); // For development

  // Check if code was already sent
  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const storedCode = twoFactorAuth.getStoredCode(userId);
    const displayCode = sessionStorage.getItem(`2fa_display_code_${userId}`);
    
    // If there's a stored code, it means code was already sent
    if (storedCode) {
      setCodeSent(true);
      if (displayCode) {
        setDisplayCode(displayCode);
      }
    } else {
      // Reset state for new session
      setCodeSent(false);
      setDisplayCode('');
      setCode(['', '', '', '', '', '']);
    }
  }, [isOpen, userId]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = twoFactorAuth.getRemainingTime(userId);
      setRemainingTime(remaining);

      if (remaining <= 0) {
        setError('انتهت صلاحية الرمز. الرجاء طلب رمز جديد.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, userId]);

  // Check if can resend
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCanResend(twoFactorAuth.canResendCode(userId));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, userId]);

  // Handle code input
  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    setSuccess('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  // Verify code
  const handleVerify = async (codeString) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = twoFactorAuth.verifyCode(userId, codeString);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
      } else {
        setError(result.error);
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-input-0')?.focus();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('حدث خطأ أثناء التحقق. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Send initial code
  const handleSendCode = async () => {
    console.log('handleSendCode - Starting', { userId, email });
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate new code
      const newCode = twoFactorAuth.generateCode();
      console.log('handleSendCode - Generated code:', newCode);
      
      twoFactorAuth.storeCode(userId, newCode);
      console.log('handleSendCode - Code stored');

      // Send code via email
      const result = await twoFactorAuth.sendCodeViaEmail(userId, email, newCode);
      console.log('handleSendCode - Send result:', result);

      if (result.success) {
        setSuccess(result.message);
        setCodeSent(true);
        
        // Update display code if available
        if (result.code) {
          setDisplayCode(result.code);
        }
        
        setTimeout(() => {
          document.getElementById('code-input-0')?.focus();
        }, 100);
      } else {
        setError(result.error || 'فشل إرسال الرمز');
      }
    } catch (err) {
      console.error('Send code error:', err);
      setError('حدث خطأ أثناء إرسال الرمز. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      console.log('handleSendCode - Finished');
    }
  };

  // Resend code
  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate new code
      const newCode = twoFactorAuth.generateCode();
      twoFactorAuth.storeCode(userId, newCode);

      // Send code via email
      const result = await twoFactorAuth.sendCodeViaEmail(userId, email, newCode);

      if (result.success) {
        setSuccess(result.message);
        twoFactorAuth.markResend(userId);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        
        // Update display code if available
        if (result.code) {
          setDisplayCode(result.code);
        }
        
        setTimeout(() => {
          document.getElementById('code-input-0')?.focus();
        }, 100);
      } else {
        setError(result.error || 'فشل إرسال الرمز');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('حدث خطأ أثناء إعادة الإرسال. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="two-factor-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="two-factor-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          {/* Header */}
          <div className="modal-header">
            <motion.div
              className="shield-icon"
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
              <FaShieldAlt />
            </motion.div>
            <h2>التحقق الثنائي</h2>
            <p>أدخل الرمز المكون من 6 أرقام</p>
          </div>

          {/* Send method info */}
          <div className="send-method-info">
            <FaEnvelope />
            <span>سيتم إرسال الرمز إلى: {email?.replace(/(.{3}).*(@.*)/, '$1***$2')}</span>
          </div>

          {/* Development: Display code */}
          {displayCode && (
            <motion.div
              className="dev-code-display"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#78350f',
                padding: '16px',
                borderRadius: '12px',
                margin: '16px 0',
                textAlign: 'center',
                fontWeight: '700',
                fontSize: '1.1rem',
                border: '2px dashed #78350f'
              }}
            >
              <div style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>
                🔧 وضع التطوير - الرمز:
              </div>
              <div style={{ fontSize: '2rem', letterSpacing: '8px', fontFamily: 'monospace' }}>
                {displayCode}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>
                (هذا الرمز يظهر فقط في وضع التطوير)
              </div>
            </motion.div>
          )}

          {/* Send code button (if not sent yet) */}
          {!codeSent && (
            <motion.button
              className="send-code-btn"
              onClick={handleSendCode}
              disabled={loading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                  : 'linear-gradient(135deg, #003DA5 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: '700',
                fontSize: '1.1rem',
                marginBottom: '16px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(0, 61, 165, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <FaEnvelope />
              {loading ? 'جاري الإرسال...' : 'إرسال الرمز إلى البريد الإلكتروني'}
            </motion.button>
          )}

          {/* Error/Success messages */}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {success}
            </motion.div>
          )}

          {/* Code inputs */}
          {codeSent && (
            <>
              <div className="code-inputs" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="timer">
                <FaClock />
                <span>
                  {remainingTime > 0
                    ? `الرمز صالح لمدة ${formatTime(remainingTime)}`
                    : 'انتهت صلاحية الرمز'}
                </span>
              </div>

              {/* Resend button */}
              <button
                className="resend-btn"
                onClick={handleResend}
                disabled={!canResend || loading}
              >
                <FaRedo />
                {canResend ? 'إعادة إرسال الرمز' : 'يمكنك إعادة الإرسال بعد دقيقة'}
              </button>
            </>
          )}

          {/* Info */}
          <div className="info-text">
            <p>لم تستلم الرمز؟</p>
            <p>تحقق من مجلد الرسائل غير المرغوب فيها أو انتظر دقيقة وأعد المحاولة</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TwoFactorModal;
