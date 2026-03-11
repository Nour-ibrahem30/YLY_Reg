// Two-Factor Authentication (2FA) System
import securityLogger from './securityLogger';
import emailjs from '@emailjs/browser';

// Initialize EmailJS with Public Key
if (process.env.REACT_APP_EMAILJS_PUBLIC_KEY) {
  emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
}

class TwoFactorAuth {
  constructor() {
    this.codeLength = 6;
    this.codeExpiry = 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = 3;
  }

  // Generate random 6-digit code
  generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  // Store verification code
  storeCode(userId, code) {
    const data = {
      code,
      timestamp: Date.now(),
      attempts: 0,
      verified: false
    };
    
    sessionStorage.setItem(`2fa_${userId}`, JSON.stringify(data));
    
    securityLogger.info('2fa_code_generated', 'تم إنشاء رمز التحقق الثنائي', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    return code;
  }

  // Get stored code
  getStoredCode(userId) {
    const stored = sessionStorage.getItem(`2fa_${userId}`);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing 2FA code:', error);
      return null;
    }
  }

  // Verify code
  verifyCode(userId, inputCode) {
    const stored = this.getStoredCode(userId);
    
    if (!stored) {
      securityLogger.warn('2fa_verification_failed', 'لا يوجد رمز تحقق مخزن', { userId });
      return {
        success: false,
        error: 'لم يتم إرسال رمز التحقق. الرجاء طلب رمز جديد.'
      };
    }

    // Check if code expired
    const timeElapsed = Date.now() - stored.timestamp;
    if (timeElapsed > this.codeExpiry) {
      this.clearCode(userId);
      securityLogger.warn('2fa_code_expired', 'انتهت صلاحية رمز التحقق', { userId });
      return {
        success: false,
        error: 'انتهت صلاحية الرمز. الرجاء طلب رمز جديد.'
      };
    }

    // Check max attempts
    if (stored.attempts >= this.maxAttempts) {
      this.clearCode(userId);
      securityLogger.warn('2fa_max_attempts', 'تم تجاوز عدد المحاولات', { userId });
      return {
        success: false,
        error: 'تم تجاوز عدد المحاولات. الرجاء طلب رمز جديد.'
      };
    }

    // Verify code
    if (stored.code === inputCode) {
      stored.verified = true;
      sessionStorage.setItem(`2fa_${userId}`, JSON.stringify(stored));
      
      securityLogger.info('2fa_verification_success', 'تم التحقق بنجاح', { userId });
      
      return {
        success: true,
        message: 'تم التحقق بنجاح!'
      };
    } else {
      // Increment attempts
      stored.attempts += 1;
      sessionStorage.setItem(`2fa_${userId}`, JSON.stringify(stored));
      
      const remainingAttempts = this.maxAttempts - stored.attempts;
      
      securityLogger.warn('2fa_verification_failed', 'رمز التحقق غير صحيح', {
        userId,
        attempts: stored.attempts,
        remaining: remainingAttempts
      });
      
      return {
        success: false,
        error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`
      };
    }
  }

  // Check if user is verified
  isVerified(userId) {
    const stored = this.getStoredCode(userId);
    if (!stored) return false;
    
    // Check if expired
    const timeElapsed = Date.now() - stored.timestamp;
    if (timeElapsed > this.codeExpiry) {
      this.clearCode(userId);
      return false;
    }
    
    return stored.verified === true;
  }

  // Clear code
  clearCode(userId) {
    sessionStorage.removeItem(`2fa_${userId}`);
    securityLogger.debug('2fa_code_cleared', 'تم مسح رمز التحقق', { userId });
  }

  // Get remaining time
  getRemainingTime(userId) {
    const stored = this.getStoredCode(userId);
    if (!stored) return 0;
    
    const timeElapsed = Date.now() - stored.timestamp;
    const remaining = this.codeExpiry - timeElapsed;
    
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  // Resend code (with rate limiting)
  canResendCode(userId) {
    const lastResend = sessionStorage.getItem(`2fa_resend_${userId}`);
    if (!lastResend) return true;
    
    const timeElapsed = Date.now() - parseInt(lastResend);
    const minResendInterval = 60 * 1000; // 1 minute
    
    return timeElapsed > minResendInterval;
  }

  // Mark resend timestamp
  markResend(userId) {
    sessionStorage.setItem(`2fa_resend_${userId}`, Date.now().toString());
  }

  // Send code via email
  async sendCodeViaEmail(userId, email, code) {
    console.log(`📧 Attempting to send 2FA code to ${email}`);
    
    // Store code for development display (temporary)
    sessionStorage.setItem(`2fa_display_code_${userId}`, code);
    
    // Check if EmailJS is configured
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    
    // If EmailJS is fully configured, try to send real email
    if (serviceId && templateId && publicKey && 
        serviceId !== 'your_service_id' && 
        templateId !== 'your_template_id') {
      try {
        console.log('📧 Sending email via EmailJS...');
        
        const result = await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: email,
            verification_code: code,
            user_id: userId
          }
        );

        console.log('✅ Email sent successfully:', result);
        
        securityLogger.info('2fa_code_sent', 'تم إرسال رمز التحقق عبر البريد الإلكتروني', {
          userId,
          email: email.replace(/(.{3}).*(@.*)/, '$1***$2')
        });
        
        return {
          success: true,
          message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
          code: code // For development display
        };
      } catch (error) {
        console.error('❌ EmailJS error:', error);
        
        securityLogger.error('2fa_send_failed', 'فشل إرسال رمز التحقق', {
          userId,
          error: error.message
        });
        
        // Fallback to development mode
        console.log('⚠️ Falling back to development mode');
      }
    }
    
    // Development mode - show code in UI
    console.log('🔧 Development mode - Code will be displayed in UI');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    securityLogger.info('2fa_code_sent', 'تم إنشاء رمز التحقق (وضع التطوير)', {
      userId,
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2')
    });
    
    return {
      success: true,
      message: 'تم إنشاء رمز التحقق (وضع التطوير - الرمز معروض أدناه)',
      code: code // Return code for development display
    };
  }

  // Enable 2FA for user
  enable2FA(userId) {
    localStorage.setItem(`2fa_enabled_${userId}`, 'true');
    securityLogger.info('2fa_enabled', 'تم تفعيل التحقق الثنائي', { userId });
  }

  // Disable 2FA for user
  disable2FA(userId) {
    localStorage.removeItem(`2fa_enabled_${userId}`);
    this.clearCode(userId);
    securityLogger.info('2fa_disabled', 'تم تعطيل التحقق الثنائي', { userId });
  }

  // Check if 2FA is enabled for user
  is2FAEnabled(userId) {
    return localStorage.getItem(`2fa_enabled_${userId}`) === 'true';
  }

  // Get 2FA statistics
  getStatistics(userId) {
    const stored = this.getStoredCode(userId);
    
    return {
      enabled: this.is2FAEnabled(userId),
      verified: this.isVerified(userId),
      remainingTime: this.getRemainingTime(userId),
      attempts: stored?.attempts || 0,
      maxAttempts: this.maxAttempts,
      canResend: this.canResendCode(userId)
    };
  }
}

// Create singleton instance
const twoFactorAuth = new TwoFactorAuth();

export default twoFactorAuth;
