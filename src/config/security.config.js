// Security Configuration
// يمكن تعديل هذه القيم حسب الحاجة

export const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimit: {
    maxAttempts: parseInt(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS) || 5,
    windowMs: parseInt(process.env.REACT_APP_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    blockDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Password Policy
  password: {
    minLength: parseInt(process.env.REACT_APP_PASSWORD_MIN_LENGTH) || 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*(),.?":{}|<>',
    maxLength: 128
  },

  // File Upload
  fileUpload: {
    maxSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
    blockedExtensions: ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html', '.htm']
  },

  // Input Validation
  validation: {
    egyptianIdLength: 14,
    egyptianPhonePattern: /^01[0125]\d{8}$/,
    arabicNamePattern: /^[\u0600-\u06FF\s]+$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    disposableEmailDomains: [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'temp-mail.org'
    ]
  },

  // Session
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    extendOnActivity: true,
    storageType: 'sessionStorage' // or 'localStorage'
  },

  // Security Headers (for reference - implement on backend)
  headers: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()'
  },

  // Attack Detection
  attackDetection: {
    enabled: true,
    logAttempts: true,
    blockOnDetection: true,
    patterns: {
      xss: /<script|javascript:|on\w+\s*=/i,
      sqlInjection: /union.*select|drop.*table|insert.*into|delete.*from/i,
      pathTraversal: /\.\.[\/\\]/,
      templateInjection: /\$\{.*\}/
    }
  },

  // Logging
  logging: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    logSecurityEvents: true,
    logFailedLogins: true,
    logFileUploads: true
  }
};

// Helper function to get config value
export const getSecurityConfig = (path) => {
  const keys = path.split('.');
  let value = SECURITY_CONFIG;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return null;
  }
  
  return value;
};

// Validate configuration on load
export const validateSecurityConfig = () => {
  const errors = [];

  // Validate rate limit
  if (SECURITY_CONFIG.rateLimit.maxAttempts < 1) {
    errors.push('Rate limit maxAttempts must be at least 1');
  }

  // Validate password policy
  if (SECURITY_CONFIG.password.minLength < 6) {
    errors.push('Password minLength must be at least 6');
  }

  // Validate file upload
  if (SECURITY_CONFIG.fileUpload.maxSize < 1024) {
    errors.push('File upload maxSize must be at least 1KB');
  }

  if (errors.length > 0) {
    console.error('Security Configuration Errors:', errors);
    return { valid: false, errors };
  }

  console.log('✅ Security configuration validated successfully');
  return { valid: true };
};

// Initialize and validate on import
validateSecurityConfig();

export default SECURITY_CONFIG;
