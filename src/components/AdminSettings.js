import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCog, 
  FaBell, 
  FaShieldAlt, 
  FaPalette, 
  FaDatabase,
  FaArrowLeft,
  FaToggleOn,
  FaToggleOff,
  FaSave
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import '../styles/AdminSettings.css';

function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      newRegistrations: true,
      taskSubmissions: true,
      eventRegistrations: true,
      systemAlerts: true
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      maxLoginAttempts: 3
    },
    appearance: {
      darkMode: true,
      compactView: false,
      animationsEnabled: true
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetention: 90
    }
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleInputChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="app-container">
      <Sidebar isAdmin={true} />
      <div className="main-content">
        <div className="admin-settings-page">
          <div className="admin-settings-container">
            {/* Top Bar */}
            <motion.div 
              className="settings-topbar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button 
                className="back-btn"
                onClick={() => navigate('/admin')}
              >
                <FaArrowLeft />
                <span>العودة للوحة التحكم</span>
              </button>
            </motion.div>

            {/* Header */}
            <motion.div 
              className="settings-header-admin"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="header-icon-large">
                <FaCog />
              </div>
              <div>
                <h1>إعدادات النظام</h1>
                <p>إدارة إعدادات لوحة التحكم والنظام</p>
              </div>
            </motion.div>

            {/* Message */}
            {message.text && (
              <motion.div
                className={`message-alert ${message.type}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {message.text}
              </motion.div>
            )}

            {/* Notifications Settings */}
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <FaBell />
                </div>
                <div>
                  <h2>الإشعارات</h2>
                  <p>إدارة إشعارات النظام</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>طلبات التسجيل الجديدة</h3>
                    <p>تلقي إشعار عند تسجيل عضو جديد</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.notifications.newRegistrations ? 'active' : ''}`}
                    onClick={() => handleToggle('notifications', 'newRegistrations')}
                  >
                    {settings.notifications.newRegistrations ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>رفع المهام</h3>
                    <p>تلقي إشعار عند رفع مهمة جديدة</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.notifications.taskSubmissions ? 'active' : ''}`}
                    onClick={() => handleToggle('notifications', 'taskSubmissions')}
                  >
                    {settings.notifications.taskSubmissions ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>تسجيل الفعاليات</h3>
                    <p>تلقي إشعار عند تسجيل عضو في فعالية</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.notifications.eventRegistrations ? 'active' : ''}`}
                    onClick={() => handleToggle('notifications', 'eventRegistrations')}
                  >
                    {settings.notifications.eventRegistrations ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>تنبيهات النظام</h3>
                    <p>تلقي تنبيهات حول أمان النظام</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.notifications.systemAlerts ? 'active' : ''}`}
                    onClick={() => handleToggle('notifications', 'systemAlerts')}
                  >
                    {settings.notifications.systemAlerts ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Security Settings */}
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <FaShieldAlt />
                </div>
                <div>
                  <h2>الأمان</h2>
                  <p>إعدادات الأمان والحماية</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>التحقق الثنائي</h3>
                    <p>تفعيل التحقق بخطوتين للأدمن</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.security.twoFactorAuth ? 'active' : ''}`}
                    onClick={() => handleToggle('security', 'twoFactorAuth')}
                  >
                    {settings.security.twoFactorAuth ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>مهلة الجلسة</h3>
                    <p>المدة بالدقائق قبل تسجيل الخروج التلقائي</p>
                  </div>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="120"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>محاولات تسجيل الدخول</h3>
                    <p>الحد الأقصى لمحاولات الدخول الفاشلة</p>
                  </div>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </motion.div>

            {/* Appearance Settings */}
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <FaPalette />
                </div>
                <div>
                  <h2>المظهر</h2>
                  <p>تخصيص مظهر لوحة التحكم</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>الوضع الداكن</h3>
                    <p>تفعيل الوضع الداكن للوحة التحكم</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.appearance.darkMode ? 'active' : ''}`}
                    onClick={() => handleToggle('appearance', 'darkMode')}
                  >
                    {settings.appearance.darkMode ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>العرض المضغوط</h3>
                    <p>عرض المزيد من المحتوى في مساحة أقل</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.appearance.compactView ? 'active' : ''}`}
                    onClick={() => handleToggle('appearance', 'compactView')}
                  >
                    {settings.appearance.compactView ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>الحركات والتأثيرات</h3>
                    <p>تفعيل الحركات الانتقالية</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.appearance.animationsEnabled ? 'active' : ''}`}
                    onClick={() => handleToggle('appearance', 'animationsEnabled')}
                  >
                    {settings.appearance.animationsEnabled ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* System Settings */}
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <FaDatabase />
                </div>
                <div>
                  <h2>النظام</h2>
                  <p>إعدادات النظام والبيانات</p>
                </div>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>النسخ الاحتياطي التلقائي</h3>
                    <p>إنشاء نسخة احتياطية تلقائياً</p>
                  </div>
                  <button
                    className={`toggle-btn ${settings.system.autoBackup ? 'active' : ''}`}
                    onClick={() => handleToggle('system', 'autoBackup')}
                  >
                    {settings.system.autoBackup ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>تكرار النسخ الاحتياطي</h3>
                    <p>عدد مرات النسخ الاحتياطي</p>
                  </div>
                  <select
                    className="setting-select"
                    value={settings.system.backupFrequency}
                    onChange={(e) => handleInputChange('system', 'backupFrequency', e.target.value)}
                  >
                    <option value="hourly">كل ساعة</option>
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>الاحتفاظ بالبيانات</h3>
                    <p>عدد الأيام للاحتفاظ بالسجلات</p>
                  </div>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.system.dataRetention}
                    onChange={(e) => handleInputChange('system', 'dataRetention', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div 
              className="save-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button className="save-btn" onClick={handleSave}>
                <FaSave />
                <span>حفظ الإعدادات</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
