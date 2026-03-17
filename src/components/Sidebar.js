import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUser, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaBell,
  FaCog,
  FaBars,
  FaTimes,
  FaChartBar,
  FaMapMarkerAlt,
  FaQrcode,
  FaUserClock,
  FaExclamationTriangle,
  FaUserShield
} from 'react-icons/fa';
import '../styles/Sidebar.css';

function Sidebar({ isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const userMenuItems = [
    { path: '/dashboard', icon: FaHome, label: 'الرئيسية' },
    { path: '/profile', icon: FaUser, label: 'الملف الشخصي' },
    { path: '/events', icon: FaCalendarAlt, label: 'الفعاليات' },
    { path: '/tasks', icon: FaClipboardList, label: 'المهام' },
    { path: '/notifications', icon: FaBell, label: 'الإشعارات' },
    { path: '/settings', icon: FaCog, label: 'الإعدادات' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: FaHome, label: 'الرئيسية' },
    { path: '/admin/analytics', icon: FaChartBar, label: 'التحليلات' },
    { path: '/admin/governorates', icon: FaMapMarkerAlt, label: 'المحافظات' },
    { path: '/admin/events', icon: FaCalendarAlt, label: 'الفعاليات' },
    { path: '/admin/pending', icon: FaUserClock, label: 'الطلبات' },
    { path: '/admin/tasks', icon: FaClipboardList, label: 'المهام' },
    { path: '/admin/admins', icon: FaUserShield, label: 'الأدمن' },
    { path: '/admin/scanner', icon: FaQrcode, label: 'QR' },
    { path: '/admin/unauthorized-attempts', icon: FaExclamationTriangle, label: 'المحاولات' },
    { path: '/admin/settings', icon: FaCog, label: 'الإعدادات' },
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
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
              onClick={() => setIsOpen(false)}
              title={item.label}
            >
              <item.icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

      </aside>
    </>
  );
}

export default Sidebar;
