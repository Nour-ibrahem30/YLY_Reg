import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUser, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaTrophy,
  FaBell,
  FaCog,
  FaBars,
  FaTimes,
  FaChartBar,
  FaUsers,
  FaMapMarkerAlt,
  FaQrcode,
  FaUserClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import '../styles/Sidebar.css';

function Sidebar({ isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const userMenuItems = [
    { path: '/dashboard', icon: FaHome, label: 'الرئيسية', badge: null },
    { path: '/profile', icon: FaUser, label: 'الملف الشخصي', badge: null },
    { path: '/events', icon: FaCalendarAlt, label: 'الفعاليات', badge: '3' },
    { path: '/tasks', icon: FaClipboardList, label: 'المهام', badge: '2' },
    { path: '/notifications', icon: FaBell, label: 'الإشعارات', badge: '5' },
    { path: '/settings', icon: FaCog, label: 'الإعدادات', badge: null },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: FaHome, label: 'لوحة التحكم', badge: null },
    { path: '/admin/analytics', icon: FaChartBar, label: 'التحليلات', badge: null },
    { path: '/admin/governorates', icon: FaMapMarkerAlt, label: 'المحافظات', badge: null },
    { path: '/admin/events', icon: FaCalendarAlt, label: 'الفعاليات', badge: null },
    { path: '/admin/pending', icon: FaUserClock, label: 'طلبات التسجيل', badge: '5' },
    { path: '/admin/tasks', icon: FaClipboardList, label: 'المهام', badge: '3' },
    { path: '/admin/scanner', icon: FaQrcode, label: 'ماسح QR', badge: null },
    { path: '/admin/unauthorized-attempts', icon: FaExclamationTriangle, label: 'محاولات الدخول', badge: null },
    { path: '/admin/settings', icon: FaCog, label: 'الإعدادات', badge: null },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/images/yly-logo.jpg" alt="YLY" />
          <h2>YLY Platform</h2>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info at Bottom */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <FaUser />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Ahmed Mohamed</div>
              <div className="sidebar-user-role">{isAdmin ? 'مسؤول' : 'عضو'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
