import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaMapMarkerAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import { getActiveEvents } from '../services/eventService';
import { getAttendanceByUser } from '../services/attendanceService';
import '../styles/UserEvents.css';

function UserEvents({ userId }) {
  const [events, setEvents] = useState([]);
  const [userAttendance, setUserAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load active events
    const eventsResult = await getActiveEvents();
    if (eventsResult.success) {
      setEvents(eventsResult.events);
    }

    // Load user attendance
    if (userId) {
      const attendanceResult = await getAttendanceByUser(userId);
      if (attendanceResult.success) {
        setUserAttendance(attendanceResult.attendance);
      }
    }

    setLoading(false);
  };

  const hasAttended = (eventId) => {
    return userAttendance.some(att => att.eventId === eventId);
  };

  const getEventStatus = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);
    
    if (event < today) {
      return 'past';
    } else if (event.getTime() === today.getTime()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'today':
        return { text: 'اليوم', class: 'today' };
      case 'upcoming':
        return { text: 'قريباً', class: 'upcoming' };
      case 'past':
        return { text: 'انتهت', class: 'past' };
      default:
        return { text: '', class: '' };
    }
  };

  if (loading) {
    return (
      <div className="user-events-section">
        <div className="loading-text">جاري تحميل الفعاليات...</div>
      </div>
    );
  }

  return (
    <div className="user-events-section">
      <motion.div 
        className="section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>
          <FaCalendar /> الفعاليات المتاحة
        </h2>
        <p>تابع الفعاليات والأنشطة القادمة</p>
      </motion.div>

      {events.length === 0 ? (
        <div className="no-events-message">
          <FaCalendar size={50} />
          <p>لا توجد فعاليات متاحة حالياً</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event, index) => {
            const status = getEventStatus(event.date);
            const statusInfo = getStatusText(status);
            const attended = hasAttended(event.id);

            return (
              <motion.div 
                key={event.id}
                className={`event-item ${status} ${attended ? 'attended' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="event-date-badge">
                  <div className="date-day">
                    {new Date(event.date).getDate()}
                  </div>
                  <div className="date-month">
                    {new Date(event.date).toLocaleDateString('ar-EG', { month: 'short' })}
                  </div>
                </div>

                <div className="event-content">
                  <div className="event-header-row">
                    <h3>{event.name}</h3>
                    <div className="event-badges">
                      {attended && (
                        <span className="attended-badge">
                          <FaCheckCircle /> حضرت
                        </span>
                      )}
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  <div className="event-meta">
                    <div className="meta-item">
                      <FaCalendar />
                      <span>
                        {new Date(event.date).toLocaleDateString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="meta-item">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserEvents;
