import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  FaUsers, FaMapMarkerAlt, FaChartBar, FaTrophy, 
  FaCalendarAlt, FaArrowLeft, FaMoon, FaSun 
} from 'react-icons/fa';
import '../styles/AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalGovernorates: 0,
    totalCommittees: 0,
    governoratesData: [],
    committeesData: [],
    rolesData: [],
    topGovernorates: []
  });

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط',
    'الأقصر', 'قنا', 'كفر الشيخ', 'مطروح', 'شمال سيناء',
    'جنوب سيناء', 'سوهاج'
  ];

  useEffect(() => {
    fetchAnalytics();
    // Load dark mode preference
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const users = [];

      // Fetch from users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Fetch from governorates
      for (const gov of governorates) {
        try {
          const govSnapshot = await getDocs(collection(db, gov));
          govSnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
          });
        } catch (error) {
          console.warn(`Error fetching ${gov}:`, error);
        }
      }

      // Process data
      const govCount = {};
      const committeeCount = {};
      const roleCount = {};

      users.forEach(user => {
        // Governorates
        const gov = user.governorate || 'غير محدد';
        govCount[gov] = (govCount[gov] || 0) + 1;

        // Committees
        const committee = user.committee || 'غير محدد';
        committeeCount[committee] = (committeeCount[committee] || 0) + 1;

        // Roles
        const role = user.role || 'Member';
        roleCount[role] = (roleCount[role] || 0) + 1;
      });

      // Format data for charts
      const governoratesData = Object.entries(govCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const committeesData = Object.entries(committeeCount)
        .map(([name, value]) => ({ name, value }));

      const rolesData = Object.entries(roleCount)
        .map(([name, value]) => ({ name, value }));

      const topGovernorates = governoratesData.slice(0, 5);

      setStats({
        totalMembers: users.length,
        totalGovernorates: Object.keys(govCount).length,
        totalCommittees: Object.keys(committeeCount).length,
        governoratesData: governoratesData.slice(0, 10),
        committeesData,
        rolesData,
        topGovernorates
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea', '#ff9a9e'];

  if (loading) {
    return (
      <div className={`analytics-page ${darkMode ? 'dark' : ''}`}>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-page ${darkMode ? 'dark' : ''}`}>
      <div className="analytics-container">
        {/* Header */}
        <motion.div 
          className="analytics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/admin')}>
              <FaArrowLeft /> رجوع
            </button>
            <div>
              <h1>لوحة التحليلات</h1>
              <p>إحصائيات وتحليلات شاملة</p>
            </div>
          </div>
          <button className="dark-mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </motion.div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{stats.totalMembers}</h3>
              <p>إجمالي الأعضاء</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FaMapMarkerAlt />
            </div>
            <div className="stat-info">
              <h3>{stats.totalGovernorates}</h3>
              <p>عدد المحافظات</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FaChartBar />
            </div>
            <div className="stat-info">
              <h3>{stats.totalCommittees}</h3>
              <p>عدد اللجان</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Top Governorates */}
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="chart-header">
              <FaTrophy className="chart-icon" />
              <h2>أكثر 5 محافظات نشاطاً</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topGovernorates}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Committees Distribution */}
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="chart-header">
              <FaChartBar className="chart-icon" />
              <h2>توزيع اللجان</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.committeesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.committeesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Roles Distribution */}
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="chart-header">
              <FaUsers className="chart-icon" />
              <h2>توزيع الأدوار الوظيفية</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.rolesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis dataKey="name" type="category" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#f093fb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* All Governorates */}
          <motion.div 
            className="chart-card full-width"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="chart-header">
              <FaMapMarkerAlt className="chart-icon" />
              <h2>جميع المحافظات</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.governoratesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.governoratesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
