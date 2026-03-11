import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';
import { getActiveEvents, rsvpToEvent, getUserRsvp, getEventRsvpCount } from '../services/eventService';
import { getAttendanceByUser } from '../services/attendanceService';
import Toast from './Toast';
import '../styles/UserEvents.css';

function UserEvents({ userId }) {
  const [events, setEvents] = useState([]);
  const [userAttendance, setUserAttendance] = useState([]);
  const [userRsvps, setUserRsvps] = useState({});
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingRsvp, setProcessingRsvp] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    console.log('UserEvents - userId received:', userId);
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      console.log('UserEvents - No userId provided');
      setLoading(false);
      return;
    }
    
    console.log('UserEvents - Loading data for userId:', userId);
    setLoading(true);
    
    try {
      // Load active events
      const eventsResult = await getActiveEvents();
      if (eventsResult.success) {
        const allEvents = eventsResult.events;
        
        // Filter events: show public events and private events where user is invited
        const visibleEvents = allEvents.filter(event => {
          if (!event.isPrivate) return true;
          if (event.selectedUsers && event.selectedUsers.includes(userId)) return true;
          return false;
        });
        
        console.log('UserEvents - Visible events:', visibleEvents.length);
        setEvents(visibleEvents);
        
        // Load RSVP data for each event
        const rsvps = {};
        const counts = {};
        for (const event of visibleEvents) {
          const rsvpResult = await getUserRsvp(event.id, userId);
          if (rsvpResult.success && rsvpResult.rsvp) {
            rsvps[event.id] = rsvpResult.rsvp.response;
          }
          
          const countResult = await getEventRsvpCount(event.id);
          if (countResult.success) {
            counts[event.id] = countResult.count;
          }
        }
        setUserRsvps(rsvps);
        setRsvpCounts(counts);
      }

      // Load user attendance
      if (userId) {
        const attendanceResult = await getAttendanceByUser(userId);
        if (attendanceResult.success) {
          console.log('UserEvents - Attendance records:', attendanceResult.attendance.length);
          setUserAttendance(attendanceResult.attendance);
        }
      }
    } catch (error) {
      console.error('UserEvents - Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAttended = (eventId) => {
    return userAttendance.some(att => att.eventId === eventId);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleRsvp = async (eventId, response) => {
    console.log('handleRsvp called:', { eventId, userId, response });
    setProcessingRsvp(eventId);
    
    const result = await rsvpToEvent(eventId, userId, response);
    
    console.log('RSVP result:', result);
    
    if (result.success) {
      setUserRsvps(prev => ({ ...prev, [eventId]: response }));
      // Reload RSVP count
      const countResult = await getEventRsvpCount(eventId);
      if (countResult.success) {
        setRsvpCounts(prev => ({ ...prev, [eventId]: countResult.count }));
      }
      
      // Show success toast
      showToast(result.message, 'success');
    } else {
      // Show error toast
      showToast('حدث خطأ: ' + result.error, 'error');
    }
    
    setProcessingRsvp(null);
  };

  const isEventFull = (event) => {
    if (!event.maxParticipants) return false;
    const count = rsvpCounts[event.id] || 0;
    return count >= event.maxParticipants;
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

  if (!userId) {
    return (
      <div className="user-events-section">
        <div className="no-events-message">
          <FaCalendar size={50} />
          <p>لم يتم العثور على معرف المستخدم</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-events-section">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      
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
            const userRsvp = userRsvps[event.id];
            const rsvpCount = rsvpCounts[event.id] || 0;
            const eventFull = isEventFull(event);

            return (
              <motion.div 
                key={event.id}
                className={`event-item ${status} ${attended ? 'attended' : ''} ${eventFull ? 'event-full' : ''}`}
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
                      {eventFull && (
                        <span className="full-badge">
                          اكتمل العدد
                        </span>
                      )}
                      {event.isPrivate && (
                        <span className="private-badge">
                          خاصة
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
                    
                    {event.maxParticipants && (
                      <div className="meta-item">
                        <FaUsers />
                        <span>{rsvpCount} / {event.maxParticipants} مشارك</span>
                      </div>
                    )}
                  </div>

                  {/* RSVP Buttons */}
                  {!attended && status !== 'past' && (
                    <div className="rsvp-buttons">
                      {userRsvp === 'confirmed' ? (
                        <div className="rsvp-status confirmed">
                          <FaCheckCircle /> أكدت حضورك
                        </div>
                      ) : userRsvp === 'declined' ? (
                        <div className="rsvp-status declined">
                          <FaTimesCircle /> اعتذرت عن الحضور
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRsvp(event.id, 'confirmed')}
                            disabled={processingRsvp === event.id || eventFull}
                            className="rsvp-btn confirm-btn"
                          >
                            <FaCheckCircle /> سأحضر
                          </button>
                          <button
                            onClick={() => handleRsvp(event.id, 'declined')}
                            disabled={processingRsvp === event.id}
                            className="rsvp-btn decline-btn"
                          >
                            <FaTimesCircle /> لن أحضر
                          </button>
                        </>
                      )}
                      
                      {userRsvp && (
                        <button
                          onClick={() => handleRsvp(event.id, userRsvp === 'confirmed' ? 'declined' : 'confirmed')}
                          disabled={processingRsvp === event.id || (userRsvp === 'declined' && eventFull)}
                          className="rsvp-btn change-btn"
                        >
                          تغيير الرد
                        </button>
                      )}
                    </div>
                  )}
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
