import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, 
  FaFile, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaCalendar,
  FaTimes,
  FaFileAlt,
  FaImage,
  FaFilePdf
} from 'react-icons/fa';
import { getActiveEvents } from '../services/eventService';
import { submitTask, getTasksByUser } from '../services/taskService';
import { addTaskSubmissionPoints } from '../services/pointsService';

function UserTasks({ userId, userInfo }) {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadEvents();
    loadUserTasks();
  }, [userId]);

  const loadEvents = async () => {
    const result = await getActiveEvents();
    if (result.success) {
      setEvents(result.events);
    }
  };

  const loadUserTasks = async () => {
    const result = await getTasksByUser(userId);
    if (result.success) {
      setTasks(result.tasks);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجا)' });
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'نوع الملف غير مدعوم (صور، PDF، Word فقط)' });
        return;
      }

      setSelectedFile(file);
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEventId) {
      setMessage({ type: 'error', text: 'الرجاء اختيار الفعالية' });
      return;
    }

    if (!selectedFile) {
      setMessage({ type: 'error', text: 'الرجاء اختيار ملف' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await submitTask(userId, selectedEventId, selectedFile, userInfo);

      if (result.success) {
        // Add points for task submission
        await addTaskSubmissionPoints(userId, userInfo);

        setMessage({ type: 'success', text: 'تم رفع المهمة بنجاح! (+20 نقطة)' });
        setSelectedFile(null);
        setSelectedEventId('');
        setShowUploadModal(false);
        
        // Reload tasks
        loadUserTasks();

        // Reset form
        document.getElementById('file-input').value = '';
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل رفع المهمة' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء رفع المهمة' });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="status-badge pending">
            <FaClock /> قيد المراجعة
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge approved">
            <FaCheckCircle /> مقبولة
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected">
            <FaTimesCircle /> مرفوضة
          </span>
        );
      default:
        return null;
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <FaImage />;
    if (fileType.includes('pdf')) return <FaFilePdf />;
    return <FaFileAlt />;
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'غير معروف';
  };

  return (
    <div style={{ marginTop: '50px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <h2 style={{ color: '#001845', fontSize: '2rem', fontWeight: '800' }}>
          <FaUpload style={{ marginLeft: '10px' }} />
          المهام المرفوعة
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          <FaUpload /> رفع مهمة جديدة
        </button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
              }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#001845' }}>
                  رفع مهمة جديدة
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {message.text && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: message.type === 'success' ? '#065f46' : '#dc2626',
                  fontWeight: '600'
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '700',
                    color: '#374151'
                  }}>
                    <FaCalendar style={{ marginLeft: '8px' }} />
                    اختر الفعالية
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    disabled={uploading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'Cairo, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- اختر الفعالية --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {new Date(event.date).toLocaleDateString('ar-EG')}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '700',
                    color: '#374151'
                  }}>
                    <FaFile style={{ marginLeft: '8px' }} />
                    اختر الملف (صور، PDF، Word - حد أقصى 10 ميجا)
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    accept="image/*,.pdf,.doc,.docx"
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'Cairo, sans-serif',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFile && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {getFileIcon(selectedFile.type)}
                      <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedEventId || !selectedFile}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: uploading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <FaUpload /> رفع المهمة
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {tasks.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <FaFile size={60} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontSize: '1.2rem' }}>لم ترفع أي مهام بعد</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white'
                }}>
                  {getFileIcon(task.fileType)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: '#001845',
                    marginBottom: '4px'
                  }}>
                    {getEventName(task.eventId)}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(task.uploadedAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {getStatusBadge(task.status)}
              </div>

              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#374151',
                marginBottom: '12px'
              }}>
                <strong>الملف:</strong> {task.fileName}
              </div>

              {task.reviewNotes && (
                <div style={{
                  padding: '12px',
                  background: task.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: task.status === 'approved' ? '#065f46' : '#dc2626'
                }}>
                  <strong>ملاحظات:</strong> {task.reviewNotes}
                </div>
              )}

              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginTop: '12px',
                  padding: '10px',
                  background: '#f3f4f6',
                  color: '#0066ff',
                  textAlign: 'center',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                عرض الملف
              </a>
            </motion.div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.approved {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.rejected {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default UserTasks;
