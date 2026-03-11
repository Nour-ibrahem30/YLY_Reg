// Security utilities for YLY application
import securityLogger from './securityLogger';
import { SECURITY_CONFIG } from '../config/security.config';

// Password hashing using Web Crypto API
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

// Validate Egyptian National ID
export const validateEgyptianID = (id) => {
  // Must be exactly 14 digits
  if (!/^\d{14}$/.test(id)) {
    return { valid: false, error: 'رقم الهوية يجب أن يكون 14 رقم' };
  }
  
  // Extract century (first digit)
  const century = parseInt(id[0]);
  if (century !== 2 && century !== 3) {
    return { valid: false, error: 'رقم الهوية غير صحيح' };
  }
  
  // Extract year, month, day
  const year = parseInt(id.substring(1, 3));
  const month = parseInt(id.substring(3, 5));
  const day = parseInt(id.substring(5, 7));
  
  // Validate month (01-12)
  if (month < 1 || month > 12) {
    return { valid: false, error: 'رقم الهوية غير صحيح (الشهر)' };
  }
  
  // Validate day (01-31)
  if (day < 1 || day > 31) {
    return { valid: false, error: 'رقم الهوية غير صحيح (اليوم)' };
  }
  
  // Extract governorate code
  const govCode = parseInt(id.substring(7, 9));
  if (govCode < 1 || govCode > 35) {
    return { valid: false, error: 'رقم الهوية غير صحيح (المحافظة)' };
  }
  
  return { valid: true };
};

// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'البريد الإلكتروني غير صحيح' };
  }
  
  // Check for common disposable email domains
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'لا يمكن استخدام بريد إلكتروني مؤقت' };
  }
  
  return { valid: true };
};

// Validate Egyptian phone number
export const validateEgyptianPhone = (phone) => {
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Egyptian phone patterns
  const patterns = [
    /^01[0125]\d{8}$/,           // 01X XXXXXXXX (11 digits)
    /^\+2001[0125]\d{8}$/,       // +20 01X XXXXXXXX
    /^002001[0125]\d{8}$/,       // 00 20 01X XXXXXXXX
  ];
  
  const isValid = patterns.some(pattern => pattern.test(cleanPhone));
  
  if (!isValid) {
    return { valid: false, error: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 010, 011, 012, أو 015)' };
  }
  
  return { valid: true, cleanPhone };
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`كلمة المرور يجب أن تكون ${minLength} أحرف على الأقل`);
  }
  
  if (!hasUpperCase) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!hasLowerCase) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!hasNumbers) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!hasSpecialChar) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
  }
  
  // Calculate strength
  let strength = 0;
  if (password.length >= minLength) strength += 20;
  if (hasUpperCase) strength += 20;
  if (hasLowerCase) strength += 20;
  if (hasNumbers) strength += 20;
  if (hasSpecialChar) strength += 20;
  
  return {
    valid: errors.length === 0,
    errors,
    strength, // 0-100
    level: strength < 40 ? 'ضعيفة' : strength < 70 ? 'متوسطة' : 'قوية'
  };
};

// Rate limiting helper (client-side)
const rateLimitStore = {};

export const checkRateLimit = (key, maxAttempts = SECURITY_CONFIG.rateLimit.maxAttempts, windowMs = SECURITY_CONFIG.rateLimit.windowMs) => {
  const now = Date.now();
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { attempts: 1, firstAttempt: now };
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  const timeElapsed = now - rateLimitStore[key].firstAttempt;
  
  // Reset if window has passed
  if (timeElapsed > windowMs) {
    rateLimitStore[key] = { attempts: 1, firstAttempt: now };
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  // Check if limit exceeded
  if (rateLimitStore[key].attempts >= maxAttempts) {
    const timeRemaining = Math.ceil((windowMs - timeElapsed) / 1000 / 60);
    
    // Log rate limit exceeded
    securityLogger.logRateLimitExceeded(key, rateLimitStore[key].attempts);
    
    return { 
      allowed: false, 
      remaining: 0,
      message: `تم تجاوز عدد المحاولات. حاول مرة أخرى بعد ${timeRemaining} دقيقة`
    };
  }
  
  // Increment attempts
  rateLimitStore[key].attempts += 1;
  return { 
    allowed: true, 
    remaining: maxAttempts - rateLimitStore[key].attempts 
  };
};

// XSS protection
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// SQL Injection protection (for display purposes)
export const sanitizeSQLInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /('|")/g
  ];
  
  let sanitized = input;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

// Validate file upload
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  } = options;
  
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'لم يتم اختيار ملف' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `حجم الملف كبير جداً (الحد الأقصى ${maxSizeMB}MB)` };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم' };
  }
  
  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'امتداد الملف غير مدعوم' };
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.php$/i,
    /\.js$/i,
    /\.html$/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: 'اسم الملف غير مسموح به' };
  }
  
  return { valid: true };
};

// Generate secure random token
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate Arabic name
export const validateArabicName = (name) => {
  // Must contain only Arabic letters and spaces
  const arabicOnly = /^[\u0600-\u06FF\s]+$/;
  
  if (!arabicOnly.test(name)) {
    return { valid: false, error: 'الاسم يجب أن يكون بالعربي فقط' };
  }
  
  // Must have at least 2 words (first and last name)
  const words = name.trim().split(/\s+/);
  if (words.length < 2) {
    return { valid: false, error: 'الرجاء إدخال الاسم الكامل (الاسم الأول والأخير على الأقل)' };
  }
  
  // Each word must be at least 2 characters
  if (words.some(word => word.length < 2)) {
    return { valid: false, error: 'كل جزء من الاسم يجب أن يكون حرفين على الأقل' };
  }
  
  return { valid: true };
};

// Check for common attack patterns
export const detectAttackPatterns = (input) => {
  const attackPatterns = [
    { pattern: /<script/i, type: 'XSS' },
    { pattern: /javascript:/i, type: 'XSS' },
    { pattern: /on\w+\s*=/i, type: 'XSS' },
    { pattern: /union.*select/i, type: 'SQL Injection' },
    { pattern: /drop.*table/i, type: 'SQL Injection' },
    { pattern: /\.\.\/\.\.\//i, type: 'Path Traversal' },
    { pattern: /\$\{.*\}/i, type: 'Template Injection' }
  ];
  
  for (const { pattern, type } of attackPatterns) {
    if (pattern.test(input)) {
      // Log attack detection
      securityLogger.logAttackDetected(type, input);
      return { detected: true, type };
    }
  }
  
  return { detected: false };
};

// Secure session storage
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    sessionStorage.removeItem(key);
  },
  
  clear: () => {
    sessionStorage.clear();
  }
};
