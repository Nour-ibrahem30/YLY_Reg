import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { 
  FaDownload, 
  FaArrowLeft, 
  FaUser, 
  FaQrcode, 
  FaShare,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaUsers
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import '../styles/EnhancedProfile.css';

function QRCodePage() {
  const { governorate, id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError('لم يتم العثور على البيانات');
        }
      } catch (err) {
        console.error('Error fetching document: ', err);
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id]);

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${userData?.name || 'profile'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${governorate}/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بروفايل ${userData.name}`,
          text: `شاهد بروفايل ${userData.name} على YLY`,
          url: profileUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className={`enhanced-profile-modern ${darkMode ? 'dark' : ''}`}>
        <div className="enhanced-profile-loading">
          <div className="loading-spinner-modern"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className={`enhanced-profile-modern ${darkMode ? 'dark' : ''}`}>
        <div className="enhanced-profile-error">
          <div className="error-content">
            <h2>{error || 'لم يتم العثور على البيانات'}</h2>
            <button onClick={() => navigate('/')} className="btn-primary-modern">
              <FaArrowLeft /> العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/profile/${governorate}/${id}`;

  return (
    <div className={`qr-page-modern ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <motion.div 
        className="qr-top-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button onClick={() => navigate(-1)} className="btn-back-qr">
          <FaArrowLeft />
          <span>رجوع</span>
        </button>
        
        <Link to={`/profile/${governorate}/${id}`} className="btn-profile-qr">
          <FaUser />
          <span>البروفايل</span>
        </Link>
      </motion.div>

      <div className="qr-page-container">
        {/* Header Section */}
        <motion.div 
          className="qr-header-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="qr-header-bg">
            <div className="bg-gradient-qr"></div>
            <div className="bg-pattern-qr"></div>
          </div>
          
          <div className="qr-header-content">
            <div className="qr-avatar-section">
              <div className="qr-avatar-wrapper">
                <div className="qr-avatar-ring"></div>
                <div className="qr-avatar-large">
                  {userData.profilePhotoURL ? (
                    <img src={userData.profilePhotoURL} alt={userData.name} />
                  ) : (
                    <span className="qr-avatar-initials">{getInitials(userData.name)}</span>
                  )}
                </div>
                <div className="qr-badge">
                  <FaQrcode />
                </div>
              </div>
            </div>
            
            <div className="qr-user-info">
              <h1 className="qr-user-name">{userData.name}</h1>
              <p className="qr-user-role">{userData.committee}</p>
              <div className="qr-user-meta">
                <span className="qr-meta-item">
                  <FaMapMarkerAlt />
                  {userData.governorate}
                </span>
                <span className="qr-meta-divider">•</span>
                <span className="qr-meta-item">
                  <FaUsers />
                  {userData.committee}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QR Code Card */}
        <motion.div 
          className="qr-code-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="qr-card-header">
            <div className="qr-card-title">
              <FaQrcode />
              <h2>رمز الاستجابة السريع</h2>
            </div>
            <div className="qr-card-subtitle">
              امسح الرمز للوصول إلى البروفايل مباشرة
            </div>
          </div>

          <div className="qr-code-wrapper">
            <div className="qr-code-container">
              <div className="qr-code-bg"></div>
              <QRCodeSVG
                id="qr-code-svg"
                value={profileUrl}
                size={280}
                level="H"
                includeMargin={true}
                fgColor="#1a1d29"
              />
            </div>
          </div>

          <div className="qr-actions">
            <motion.button 
              onClick={downloadQRCode}
              className="qr-btn qr-btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaDownload />
              <span>تحميل الرمز</span>
            </motion.button>

            <motion.button 
              onClick={shareProfile}
              className="qr-btn qr-btn-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaShare />
              <span>{copied ? 'تم النسخ!' : 'مشاركة'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* User Details Card */}
        <motion.div 
          className="qr-details-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="qr-details-title">معلومات الاتصال</h3>
          
          <div className="qr-details-grid">
            <div className="qr-detail-item">
              <div className="qr-detail-icon">
                <FaEnvelope />
              </div>
              <div className="qr-detail-content">
                <span className="qr-detail-label">البريد الإلكتروني</span>
                <span className="qr-detail-value">{userData.email}</span>
              </div>
            </div>

            <div className="qr-detail-item">
              <div className="qr-detail-icon">
                <FaPhone />
              </div>
              <div className="qr-detail-content">
                <span className="qr-detail-label">رقم الهاتف</span>
                <span className="qr-detail-value">{userData.number}</span>
              </div>
            </div>

            <div className="qr-detail-item">
              <div className="qr-detail-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="qr-detail-content">
                <span className="qr-detail-label">المحافظة</span>
                <span className="qr-detail-value">{userData.governorate}</span>
              </div>
            </div>

            <div className="qr-detail-item">
              <div className="qr-detail-icon">
                <FaUsers />
              </div>
              <div className="qr-detail-content">
                <span className="qr-detail-label">اللجنة</span>
                <span className="qr-detail-value">{userData.committee}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default QRCodePage;
