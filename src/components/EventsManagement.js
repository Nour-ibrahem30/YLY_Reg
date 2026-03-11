import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaUsers,
  FaTimes,
  FaCheck,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { 
  createEvent, 
  getAllEvents, 
  updateEvent, 
  deleteEvent,
  toggleEventStatus,
  listenToEvents
} from '../services/eventService';
import { getAttendanceByEvent } from '../services/attendanceService';
import '../styles/EventsManagement.css';

function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [attendanceCounts, setAttendanceCounts] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: '',
    isPrivate: false,
    selectedUsers: []
  });

  useEffect(() => {
    loadEvents();
    
    // Real-time listener
    const unsubscribe = listenToEvents((eventsData) => {
      setEvents(eventsData);
      loadAttendanceCounts(eventsData);
    });

    return () => unsubscribe();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const result = await getAllEvents();
    if (result.success) {
      setEvents(result.events);
      loadAttendanceCounts(result.events);
    }
    setLoading(false);
  };

  const loadAttendanceCounts = async (eventsData) => {
    const counts = {};
    for (const event of eventsData) {
      const result = await getAttendanceByEvent(event.id);
      if (result.success) {
        counts[event.id] = result.attendance.length;
      }
    }
    setAttendanceCounts(counts);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      description: '',
      date: '',
      location: '',
      maxParticipants: '',
      isPrivate: false,
      selectedUsers: []
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      maxParticipants: event.maxParticipants || '',
      isPrivate: event.isPrivate || false,
      selectedUsers: event.selectedUsers || []
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      location: '',
      maxParticipants: '',
      isPrivate: false,
      selectedUsers: []
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.location) {
      setMessage({ type: 'error', text: 'الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    setLoading(true);

    if (modalMode === 'create') {
      const result = await createEvent(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'تم إنشاء الفعالية بنجاح!' });
        setTimeout(() => {
          closeModal();
          loadEvents();
        }, 1500);
      } else {
        // عرض الخطأ الفعلي
        const errorMsg = result.error || 'فشل إنشاء الفعالية';
        console.error('Error creating event:', result.error);
        
        if (errorMsg.includes('permission') || errorMsg.includes('insufficient')) {
          setMessage({ 
            type: 'error', 
            text: 'خطأ في الصلاحيات! الرجاء تحديث Firebase Rules (راجع ملف FIX_EVENTS_PERMISSION.md)' 
          });
        } else {
          setMessage({ type: 'error', text: `فشل إنشاء الفعالية: ${errorMsg}` });
        }
      }
    } else {
      const result = await updateEvent(selectedEvent.id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'تم تحديث الفعالية بنجاح!' });
        setTimeout(() => {
          closeModal();
          loadEvents();
        }, 1500);
      } else {
        const errorMsg = result.error || 'فشل تحديث الفعالية';
        console.error('Error updating event:', result.error);
        setMessage({ type: 'error', text: `فشل تحديث الفعالية: ${errorMsg}` });
      }
    }

    setLoading(false);
  };

  const handleDelete = async (eventId, eventName) => {
    if (window.confirm(`هل أنت متأكد من حذف الفعالية "${eventName}"؟`)) {
      const result = await deleteEvent(eventId);
      if (result.success) {
        setMessage({ type: 'success', text: 'تم حذف الفعالية بنجاح!' });
        loadEvents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'فشل حذف الفعالية' });
      }
    }
  };

  const handleToggleStatus = async (eventId, currentStatus) => {
    const result = await toggleEventStatus(eventId, currentStatus);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      loadEvents();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: 'فشل تغيير حالة الفعالية' });
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="status-badge active">
        <FaCheck /> نشطة
      </span>
    ) : (
      <span className="status-badge closed">
        <FaTimes /> مغلقة
      </span>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div className="events-management-page">
        <div className="loading">جاري تحميل الفعاليات...</div>
      </div>
    );
  }

  return (
    <div className="events-management-page">
      <div className="events-container">
        {/* Header */}
        <motion.div 
          className="events-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>
              <FaCalendar /> إدارة الفعاليات
            </h1>
            <p>إنشاء وإدارة الفعاليات والأنشطة</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <FaPlus /> إضافة فعالية جديدة
          </button>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              className={`message ${message.type}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events Grid */}
        <div className="events-grid">
          {events.length === 0 ? (
            <div className="no-events">
              <FaCalendar size={60} />
              <p>لا توجد فعاليات حالياً</p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <FaPlus /> إضافة أول فعالية
              </button>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div 
                key={event.id}
                className={`event-card ${event.status}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="event-card-header">
                  <h3>{event.name}</h3>
                  {getStatusBadge(event.status)}
                </div>

                <div className="event-card-body">
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-details">
                    <div className="event-detail">
                      <FaCalendar />
                      <span>{new Date(event.date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    
                    <div className="event-detail">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="event-detail">
                      <FaUsers />
                      <span>{attendanceCounts[event.id] || 0} حضور</span>
                    </div>
                  </div>
                </div>

                <div className="event-card-footer">
                  <button 
                    className="btn-icon btn-toggle"
                    onClick={() => handleToggleStatus(event.id, event.status)}
                    title={event.status === 'active' ? 'إغلاق الفعالية' : 'تفعيل الفعالية'}
                  >
                    {event.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                  
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => openEditModal(event)}
                    title="تعديل"
                  >
                    <FaEdit />
                  </button>
                  
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(event.id, event.name)}
                    title="حذف"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <motion.div 
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>
                    {modalMode === 'create' ? 'إضافة فعالية جديدة' : 'تعديل الفعالية'}
                  </h2>
                  <button className="btn-close" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>اسم الفعالية *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="مثال: ورشة عمل تطوير الويب"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>الوصف</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="وصف مختصر عن الفعالية..."
                      rows="4"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>التاريخ *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>المكان *</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="مثال: قاعة المؤتمرات"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>الحد الأقصى للمشاركين (اختياري)</label>
                      <input
                        type="number"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                        placeholder="اترك فارغاً لعدد غير محدود"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="isPrivate"
                          checked={formData.isPrivate}
                          onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        فعالية خاصة (لأعضاء محددين فقط)
                      </label>
                    </div>
                  </div>

                  {formData.isPrivate && (
                    <div className="form-group">
                      <label>أرقام الهوية للأعضاء المدعوين (افصل بفاصلة)</label>
                      <textarea
                        name="selectedUsers"
                        value={formData.selectedUsers.join(', ')}
                        onChange={(e) => {
                          const users = e.target.value.split(',').map(u => u.trim()).filter(u => u);
                          setFormData(prev => ({ ...prev, selectedUsers: users }));
                        }}
                        placeholder="مثال: 12345678901234, 98765432109876"
                        rows="3"
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                        أدخل أرقام الهوية (14 رقم) مفصولة بفاصلة
                      </small>
                    </div>
                  )}

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={closeModal}
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'جاري الحفظ...' : (modalMode === 'create' ? 'إضافة' : 'حفظ التعديلات')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default EventsManagement;
