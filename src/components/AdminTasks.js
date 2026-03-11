import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaDownload, FaTrash, FaEye, FaUser, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { updateTaskStatus } from '../services/taskService';
import { addTaskApprovalPoints } from '../services/pointsService';

function AdminTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = [];
      
      tasksSnapshot.forEach((doc) => {
        tasksData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by date (newest first)
      tasksData.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.createdAt);
        const dateB = new Date(b.uploadedAt || b.createdAt);
        return dateB - dateA;
      });

      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل المهام' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task) => {
    try {
      const result = await updateTaskStatus(task.id, 'approved', 'Admin', 'تم قبول المهمة');
      
      if (result.success) {
        // Add points for task approval
        await addTaskApprovalPoints(task.userId);
        
        setMessage({ type: 'success', text: 'تم قبول المهمة بنجاح! (+30 نقطة للمستخدم)' });
        loadTasks();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error approving task:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء قبول المهمة' });
    }
  };

  const handleReject = async (task) => {
    const notes = prompt('سبب الرفض (اختياري):');
    
    try {
      const result = await updateTaskStatus(task.id, 'rejected', 'Admin', notes || 'تم رفض المهمة');
      
      if (result.success) {
        setMessage({ type: 'success', text: 'تم رفض المهمة' });
        loadTasks();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء رفض المهمة' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#FFA500', color: 'white', text: 'قيد المراجعة' },
      approved: { background: '#10b981', color: 'white', text: 'مقبولة' },
      rejected: { background: '#ef4444', color: 'white', text: 'مرفوضة' }
    };

    const style = styles[status] || styles.pending;

    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '700',
        background: style.background,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1d29',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid rgba(91, 110, 225, 0.3)',
            borderTop: '5px solid #5b6ee1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '1.2rem' }}>جاري تحميل المهام...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1d29',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            padding: '28px',
            background: '#23283a',
            border: '1px solid #2d3748',
            borderRadius: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }}
        >
          <div>
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '900', marginBottom: '5px' }}>
              المهام المرفوعة
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              إجمالي المهام: {tasks.length}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: '1px solid #2d3748',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Cairo, sans-serif',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(91, 110, 225, 0.1)';
              e.target.style.borderColor = '#5b6ee1';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = '#2d3748';
            }}
          >
            <FaArrowLeft /> رجوع
          </button>
        </motion.div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '15px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              background: message.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              fontWeight: '600'
            }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}
        >
          {[
            { value: 'all', label: 'الكل', count: tasks.length },
            { value: 'pending', label: 'قيد المراجعة', count: tasks.filter(t => t.status === 'pending').length },
            { value: 'approved', label: 'مقبولة', count: tasks.filter(t => t.status === 'approved').length },
            { value: 'rejected', label: 'مرفوضة', count: tasks.filter(t => t.status === 'rejected').length }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              style={{
                padding: '12px 24px',
                background: filter === item.value 
                  ? 'linear-gradient(135deg, #5b6ee1 0%, #7c3aed 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: filter === item.value ? 'none' : '1px solid #2d3748',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                fontFamily: 'Cairo, sans-serif',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: filter === item.value ? '0 4px 12px rgba(91, 110, 225, 0.3)' : 'none'
              }}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </motion.div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#23283a',
            border: '1px solid #2d3748',
            borderRadius: '20px',
            color: '#94a3b8'
          }}>
            <FaFileAlt style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>لا توجد مهام</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: '#23283a',
                  border: '1px solid #2d3748',
                  borderRadius: '20px',
                  padding: '24px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = '#5b6ee1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#2d3748';
                }}
              >
                {/* Task Header */}
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '5px' }}>
                      <FaUser style={{ marginLeft: '8px', color: '#5b6ee1' }} />
                      {task.userName}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      {task.userGovernorate} - {task.userCommittee}
                    </p>
                  </div>
                  {getStatusBadge(task.status)}
                </div>

                {/* Task Info */}
                <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #2d3748', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
                    <FaCalendar style={{ marginLeft: '5px' }} />
                    {new Date(task.uploadedAt || task.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    <FaFileAlt style={{ marginLeft: '5px' }} />
                    {task.fileName}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={task.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #5b6ee1 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontFamily: 'Cairo, sans-serif',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(91, 110, 225, 0.3)'
                    }}
                  >
                    <FaEye /> عرض
                  </a>
                  
                  {task.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(task)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontFamily: 'Cairo, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <FaCheckCircle /> قبول
                      </button>
                      <button
                        onClick={() => handleReject(task)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontFamily: 'Cairo, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <FaTimesCircle /> رفض
                      </button>
                    </>
                  )}
                </div>

                {/* Review Notes */}
                {task.reviewNotes && (
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#fbbf24'
                  }}>
                    <strong>ملاحظات:</strong> {task.reviewNotes}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTasks;
