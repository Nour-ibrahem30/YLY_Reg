import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCamera, FaCheckCircle, FaTimesCircle, FaUser, FaEnvelope, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { recordAttendance } from '../services/attendanceService';
import { getActiveEvents } from '../services/eventService';
import { addAttendancePoints } from '../services/pointsService';
import '../styles/QRScanner.css';

function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    loadActiveEvents();
    return () => {
      stopScanner();
    };
  }, []);

  const loadActiveEvents = async () => {
    const result = await getActiveEvents();
    if (result.success && result.events.length > 0) {
      setEvents(result.events);
      setSelectedEventId(result.events[0].id);
      setActiveEvent(result.events[0]);
    } else {
      setMessage({ type: 'error', text: 'لا توجد فعاليات نشطة حالياً' });
    }
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    const event = events.find(ev => ev.id === eventId);
    setActiveEvent(event);
  };

  const startScanner = async () => {
    try {
      if (!selectedEventId) {
        setMessage({ type: 'error', text: 'الرجاء اختيار فعالية أولاً' });
        return;
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error starting scanner:', error);
      setMessage({ type: 'error', text: 'فشل تشغيل الكاميرا' });
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && scanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setScanning(false);
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    await stopScanner();

    try {
      // Extract user info from QR code
      const userInfo = extractUserInfo(decodedText);
      
      if (!userInfo.success) {
        setMessage({ type: 'error', text: 'رمز QR غير صالح' });
        setLoading(false);
        setTimeout(() => startScanner(), 2000);
        return;
      }

      // Fetch user data from users collection
      const userDoc = await getDoc(doc(db, 'users', userInfo.userId));
      
      if (!userDoc.exists()) {
        setMessage({ type: 'error', text: 'المستخدم غير موجود أو غير معتمد' });
        setLoading(false);
        setTimeout(() => startScanner(), 2000);
        return;
      }

      const userData = userDoc.data();
      
      // Record attendance
      const attendanceResult = await recordAttendance(
        userInfo.userId,
        selectedEventId,
        'admin',
        userData
      );

      if (attendanceResult.success) {
        // Add points for attendance
        await addAttendancePoints(userInfo.userId, userData);
        
        setScannedUser({
          ...userData,
          id: userInfo.userId,
          governorate: userData.governorate
        });
        setMessage({ type: 'success', text: '✅ تم تسجيل الحضور بنجاح!' });
        
        // Auto restart scanner after 3 seconds
        setTimeout(() => {
          setScannedUser(null);
          setMessage({ type: '', text: '' });
          startScanner();
        }, 3000);
      } else {
        if (attendanceResult.error === 'duplicate') {
          setMessage({ type: 'warning', text: '⚠️ تم تسجيل الحضور مسبقاً! لا يمكن التسجيل مرة أخرى' });
          setScannedUser({
            ...userData,
            id: userInfo.userId,
            governorate: userData.governorate,
            duplicate: true
          });
        } else {
          setMessage({ type: 'error', text: '❌ فشل تسجيل الحضور' });
        }
        
        setTimeout(() => {
          setScannedUser(null);
          setMessage({ type: '', text: '' });
          startScanner();
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء معالجة المسح' });
      setTimeout(() => startScanner(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (error) => {
    // Ignore scan errors (they happen frequently during scanning)
  };

  const extractUserInfo = (qrData) => {
    try {
      // QR contains URL like: /profile/governorate/userId
      if (qrData.includes('/profile/')) {
        const parts = qrData.split('/');
        const userId = parts[parts.length - 1];
        return { userId, success: true };
      }
      
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="qr-scanner-page">
      <div className="scanner-container">
        <motion.div 
          className="scanner-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>
            <FaCamera /> ماسح QR Code
          </h1>
          <p>امسح رمز QR الخاص بالعضو لتسجيل الحضور</p>
        </motion.div>

        {/* Event Selection */}
        <motion.div 
          className="event-selection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label>اختر الفعالية:</label>
          <select 
            value={selectedEventId} 
            onChange={handleEventChange}
            disabled={scanning}
          >
            <option value="">-- اختر فعالية --</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} - {new Date(event.date).toLocaleDateString('ar-EG')}
              </option>
            ))}
          </select>
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
              {message.type === 'success' && <FaCheckCircle />}
              {message.type === 'error' && <FaTimesCircle />}
              {message.type === 'warning' && <FaTimesCircle />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner */}
        <motion.div 
          className="scanner-box"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div id="qr-reader" ref={scannerRef}></div>
          
          {!scanning && !scannedUser && (
            <div className="scanner-placeholder">
              <FaCamera size={60} />
              <p>اضغط على "بدء المسح" لتشغيل الكاميرا</p>
            </div>
          )}
        </motion.div>

        {/* Scanner Controls */}
        <div className="scanner-controls">
          {!scanning ? (
            <button 
              className="btn btn-primary" 
              onClick={startScanner}
              disabled={!selectedEventId || loading}
            >
              <FaCamera /> بدء المسح
            </button>
          ) : (
            <button 
              className="btn btn-danger" 
              onClick={stopScanner}
            >
              <FaTimesCircle /> إيقاف المسح
            </button>
          )}
        </div>

        {/* Scanned User Card */}
        <AnimatePresence>
          {scannedUser && (
            <motion.div 
              className={`user-card ${scannedUser.duplicate ? 'duplicate' : 'success'}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <div className="user-avatar">
                {getInitials(scannedUser.name)}
              </div>
              <div className="user-info">
                <h3>{scannedUser.name}</h3>
                <div className="user-details">
                  <span><FaEnvelope /> {scannedUser.email}</span>
                  <span><FaMapMarkerAlt /> {scannedUser.governorate}</span>
                  <span><FaUsers /> {scannedUser.committee}</span>
                  <span><FaUser /> {scannedUser.role || 'غير محدد'}</span>
                </div>
              </div>
              <div className={`status-badge ${scannedUser.duplicate ? 'warning' : 'success'}`}>
                {scannedUser.duplicate ? (
                  <>
                    <FaTimesCircle /> تم التسجيل مسبقاً
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> تم التسجيل بنجاح
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QRScanner;
