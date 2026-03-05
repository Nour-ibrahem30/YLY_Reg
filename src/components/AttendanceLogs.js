import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaCalendar, 
  FaSearch, 
  FaDownload,
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBuilding,
  FaClock
} from 'react-icons/fa';
import { getAllEvents } from '../services/eventService';
import { getAttendanceByEvent, getTodayAttendance, listenToAttendance } from '../services/attendanceService';
import '../styles/AttendanceLogs.css';

function AttendanceLogs() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    byEvent: {}
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance();
    }
  }, [selectedEventId]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchTerm]);

  const loadEvents = async () => {
    const result = await getAllEvents();
    if (result.success) {
      setEvents(result.events);
      if (result.events.length > 0) {
        setSelectedEventId('all');
      }
    }
  };

  const loadAttendance = async () => {
    setLoading(true);

    if (selectedEventId === 'all') {
      // Load all attendance
      const allAttendance = [];
      for (const event of events) {
        const result = await getAttendanceByEvent(event.id);
        if (result.success) {
          allAttendance.push(...result.attendance.map(att => ({
            ...att,
            eventName: event.name
          })));
        }
      }
      setAttendance(allAttendance);
      calculateStats(allAttendance);
    } else if (selectedEventId === 'today') {
      // Load today's attendance
      const result = await getTodayAttendance();
      if (result.success) {
        const attendanceWithEvents = await Promise.all(
          result.attendance.map(async (att) => {
            const event = events.find(e => e.id === att.eventId);
            return {
              ...att,
              eventName: event ? event.name : 'غير معروف'
            };
          })
        );
        setAttendance(attendanceWithEvents);
        calculateStats(attendanceWithEvents);
      }
    } else {
      // Load specific event attendance with real-time updates
      const unsubscribe = listenToAttendance(selectedEventId, (attendanceData) => {
        const event = events.find(e => e.id === selectedEventId);
        const attendanceWithEvent = attendanceData.map(att => ({
          ...att,
          eventName: event ? event.name : 'غير معروف'
        }));
        setAttendance(attendanceWithEvent);
        calculateStats(attendanceWithEvent);
        setLoading(false);
      });

      return () => unsubscribe();
    }

    setLoading(false);
  };

  const calculateStats = (attendanceData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = attendanceData.filter(att => {
      const attDate = new Date(att.timestamp);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === today.getTime();
    }).length;

    const byEvent = {};
    attendanceData.forEach(att => {
      byEvent[att.eventId] = (byEvent[att.eventId] || 0) + 1;
    });

    setStats({
      total: attendanceData.length,
      today: todayCount,
      byEvent
    });
  };

  const filterAttendance = () => {
    if (!searchTerm) {
      setFilteredAttendance(attendance);
      return;
    }

    const filtered = attendance.filter(att =>
      att.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.userGovernorate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.userCommittee?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredAttendance(filtered);
  };

  const exportToCSV = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'المحافظة', 'اللجنة', 'الدور الوظيفي', 'الفعالية', 'التاريخ', 'الوقت'];
    const csvData = filteredAttendance.map(att => [
      att.userName,
      att.userEmail,
      att.userGovernorate,
      att.userCommittee,
      att.userRole || 'غير محدد',
      att.eventName,
      new Date(att.timestamp).toLocaleDateString('ar-EG'),
      new Date(att.timestamp).toLocaleTimeString('ar-EG')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${selectedEventId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'غير معروف';
  };

  if (loading && attendance.length === 0) {
    return (
      <div className="attendance-logs-page">
        <div className="loading">جاري تحميل سجلات الحضور...</div>
      </div>
    );
  }

  return (
    <div className="attendance-logs-page">
      <div className="attendance-container">
        {/* Header */}
        <motion.div 
          className="attendance-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>
              <FaUsers /> سجلات الحضور
            </h1>
            <p>متابعة وإدارة حضور الأعضاء في الفعاليات</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="stat-icon total">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>إجمالي الحضور</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon today">
              <FaCalendar />
            </div>
            <div className="stat-info">
              <h3>{stats.today}</h3>
              <p>حضور اليوم</p>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon events">
              <FaCalendar />
            </div>
            <div className="stat-info">
              <h3>{Object.keys(stats.byEvent).length}</h3>
              <p>عدد الفعاليات</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          className="filters-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="البحث بالاسم، البريد، المحافظة، أو اللجنة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الفعاليات</option>
            <option value="today">حضور اليوم</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>

          <button onClick={exportToCSV} className="export-btn">
            <FaDownload /> تصدير Excel
          </button>
        </motion.div>

        {/* Attendance Table */}
        <motion.div 
          className="table-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredAttendance.length === 0 ? (
            <div className="no-data">
              <FaUsers size={60} />
              <p>لا توجد سجلات حضور</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th><FaUser /> الاسم</th>
                    <th><FaEnvelope /> البريد الإلكتروني</th>
                    <th><FaMapMarkerAlt /> المحافظة</th>
                    <th><FaBuilding /> اللجنة</th>
                    <th><FaUser /> الدور</th>
                    <th><FaCalendar /> الفعالية</th>
                    <th><FaClock /> التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((att, index) => (
                    <motion.tr 
                      key={att.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <td>{index + 1}</td>
                      <td className="user-name">{att.userName}</td>
                      <td>{att.userEmail}</td>
                      <td>
                        <span className="badge badge-governorate">
                          {att.userGovernorate}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-committee">
                          {att.userCommittee}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-role">
                          {att.userRole || 'غير محدد'}
                        </span>
                      </td>
                      <td className="event-name">{att.eventName}</td>
                      <td className="timestamp">
                        <div>{new Date(att.timestamp).toLocaleDateString('ar-EG')}</div>
                        <div className="time">
                          {new Date(att.timestamp).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default AttendanceLogs;
