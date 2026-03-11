// Security Event Logger
import { SECURITY_CONFIG } from '../config/security.config';

class SecurityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  // Log levels
  levels = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
  };

  // Event types
  eventTypes = {
    LOGIN_ATTEMPT: 'login_attempt',
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    REGISTRATION: 'registration',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    ATTACK_DETECTED: 'attack_detected',
    FILE_UPLOAD: 'file_upload',
    VALIDATION_ERROR: 'validation_error',
    SESSION_EXPIRED: 'session_expired',
    UNAUTHORIZED_ACCESS: 'unauthorized_access'
  };

  // Log a security event
  log(level, eventType, message, data = {}) {
    if (!SECURITY_CONFIG.logging.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output based on level
    const consoleMethod = level === 'error' || level === 'critical' ? 'error' 
                        : level === 'warn' ? 'warn' 
                        : 'log';

    if (SECURITY_CONFIG.logging.logLevel === 'debug' || level !== 'debug') {
      console[consoleMethod](`[SECURITY ${level.toUpperCase()}]`, message, data);
    }

    // Store in localStorage for persistence (optional)
    this.persistLog(logEntry);

    // Send to backend (implement this in production)
    // this.sendToBackend(logEntry);
  }

  // Persist log to localStorage
  persistLog(logEntry) {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      storedLogs.push(logEntry);
      
      // Keep only last 100 logs in localStorage
      if (storedLogs.length > 100) {
        storedLogs.shift();
      }
      
      localStorage.setItem('security_logs', JSON.stringify(storedLogs));
    } catch (error) {
      console.error('Failed to persist security log:', error);
    }
  }

  // Convenience methods
  debug(eventType, message, data) {
    this.log(this.levels.DEBUG, eventType, message, data);
  }

  info(eventType, message, data) {
    this.log(this.levels.INFO, eventType, message, data);
  }

  warn(eventType, message, data) {
    this.log(this.levels.WARN, eventType, message, data);
  }

  error(eventType, message, data) {
    this.log(this.levels.ERROR, eventType, message, data);
  }

  critical(eventType, message, data) {
    this.log(this.levels.CRITICAL, eventType, message, data);
  }

  // Specific event loggers
  logLoginAttempt(userId, success = false) {
    const eventType = success ? this.eventTypes.LOGIN_SUCCESS : this.eventTypes.LOGIN_FAILED;
    const level = success ? this.levels.INFO : this.levels.WARN;
    const message = success ? 'تسجيل دخول ناجح' : 'محاولة تسجيل دخول فاشلة';
    
    this.log(level, eventType, message, { userId });
  }

  logRegistration(userId, email) {
    this.log(this.levels.INFO, this.eventTypes.REGISTRATION, 'تسجيل مستخدم جديد', {
      userId,
      email
    });
  }

  logRateLimitExceeded(key, attempts) {
    this.log(this.levels.WARN, this.eventTypes.RATE_LIMIT_EXCEEDED, 
      'تم تجاوز عدد المحاولات المسموح بها', {
      key,
      attempts
    });
  }

  logAttackDetected(attackType, input) {
    this.log(this.levels.CRITICAL, this.eventTypes.ATTACK_DETECTED, 
      `تم اكتشاف محاولة هجوم: ${attackType}`, {
      attackType,
      inputLength: input?.length || 0,
      inputPreview: input?.substring(0, 50) || ''
    });
  }

  logFileUpload(fileName, fileSize, success = true) {
    const level = success ? this.levels.INFO : this.levels.WARN;
    const message = success ? 'تم رفع ملف بنجاح' : 'فشل رفع الملف';
    
    this.log(level, this.eventTypes.FILE_UPLOAD, message, {
      fileName,
      fileSize
    });
  }

  logValidationError(field, error) {
    this.log(this.levels.WARN, this.eventTypes.VALIDATION_ERROR, 
      `خطأ في التحقق من ${field}`, {
      field,
      error
    });
  }

  // Get logs
  getLogs(filter = {}) {
    let filteredLogs = [...this.logs];

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === filter.eventType);
    }

    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filter.startDate)
      );
    }

    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filter.endDate)
      );
    }

    return filteredLogs;
  }

  // Get logs from localStorage
  getPersistedLogs() {
    try {
      return JSON.parse(localStorage.getItem('security_logs') || '[]');
    } catch (error) {
      console.error('Failed to get persisted logs:', error);
      return [];
    }
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('security_logs');
    console.log('Security logs cleared');
  }

  // Export logs
  exportLogs(format = 'json') {
    const allLogs = [...this.logs, ...this.getPersistedLogs()];
    
    if (format === 'json') {
      return JSON.stringify(allLogs, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Event Type', 'Message', 'Data'];
      const rows = allLogs.map(log => [
        log.timestamp,
        log.level,
        log.eventType,
        log.message,
        JSON.stringify(log.data)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return allLogs;
  }

  // Download logs
  downloadLogs(format = 'json') {
    const content = this.exportLogs(format);
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get statistics
  getStatistics() {
    const allLogs = [...this.logs, ...this.getPersistedLogs()];
    
    const stats = {
      total: allLogs.length,
      byLevel: {},
      byEventType: {},
      recentAttacks: 0,
      failedLogins: 0,
      successfulLogins: 0
    };

    allLogs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by event type
      stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
      
      // Count specific events
      if (log.eventType === this.eventTypes.ATTACK_DETECTED) {
        stats.recentAttacks++;
      }
      if (log.eventType === this.eventTypes.LOGIN_FAILED) {
        stats.failedLogins++;
      }
      if (log.eventType === this.eventTypes.LOGIN_SUCCESS) {
        stats.successfulLogins++;
      }
    });

    return stats;
  }
}

// Create singleton instance
const securityLogger = new SecurityLogger();

export default securityLogger;
