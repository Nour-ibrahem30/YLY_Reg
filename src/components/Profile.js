import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUsers, FaCalendar, FaDownload, FaArrowLeft } from 'react-icons/fa';
import UserEvents from './UserEvents';
import UserTasks from './UserTasks';

function Profile() {
  const { governorate, id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching data for user ID:', id);
        // البحث في users collection
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Data fetched:', data);
          setUserData(data);
        } else {
          console.log('Document does not exist');
          setError('لم يتم العثور على البيانات');
        }
      } catch (err) {
        console.error('Error fetching document: ', err);
        setError('حدث خطأ أثناء تحميل البيانات: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    } else {
      setError('معلومات غير كاملة');
      setLoading(false);
    }
  }, [id]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  const profileUrl = `${window.location.origin}/profile/${governorate}/${id}`;

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #001845 0%, #002855 50%, #003d82 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600' }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #001845 0%, #002855 50%, #003d82 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', maxWidth: '500px', width: '100%' }}>
          <div style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            padding: '14px 18px', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            textAlign: 'center', 
            fontWeight: '600' 
          }}>
            {error}
          </div>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 30px',
            background: '#f3f4f6',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            <FaArrowLeft />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #001845 0%, #002855 50%, #003d82 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: '600' }}>
          لا توجد بيانات
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #001845 0%, #002855 50%, #003d82 100%)', 
      padding: '60px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '30px', 
        padding: '60px', 
        maxWidth: '1200px', 
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px', paddingBottom: '40px', borderBottom: '2px solid #f3f4f6' }}>
          <div style={{
            width: '140px',
            height: '140px',
            background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '4rem',
            color: 'white',
            fontWeight: '900'
          }}>
            {getInitials(userData.name)}
          </div>
          <h1 style={{ color: '#001845', fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800' }}>
            {userData.name}
          </h1>
          <p style={{ color: '#6b7280', fontWeight: 500 }}>عضو في مجتمع YLY</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '50px', marginTop: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaUser style={{ marginLeft: '5px' }} /> الاسم
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.name}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaEnvelope style={{ marginLeft: '5px' }} /> البريد
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.email}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaPhone style={{ marginLeft: '5px' }} /> الهاتف
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.number}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaIdCard style={{ marginLeft: '5px' }} /> رقم الهوية
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.userId}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaMapMarkerAlt style={{ marginLeft: '5px' }} /> المحافظة
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.governorate}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaUsers style={{ marginLeft: '5px' }} /> اللجنة
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.committee}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaUser style={{ marginLeft: '5px' }} /> الدور الوظيفي
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>{userData.role || 'غير محدد'}</div>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px solid #e6f0ff', gridColumn: 'span 2' }}>
              <div style={{ fontWeight: '700', color: '#0099ff', fontSize: '0.85rem', marginBottom: '8px' }}>
                <FaCalendar style={{ marginLeft: '5px' }} /> تاريخ التسجيل
              </div>
              <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>
                {new Date(userData.createdAt).toLocaleDateString('ar-EG')}
              </div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)', padding: '40px', borderRadius: '20px', textAlign: 'center', color: 'white' }}>
            <h3 style={{ marginBottom: '30px', fontSize: '1.5rem', fontWeight: '700' }}>رمز الاستجابة السريع</h3>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', display: 'inline-block' }}>
              <QRCodeSVG 
                id="qr-code-svg"
                value={profileUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#667eea"
              />
            </div>
            <p style={{ marginTop: '25px', fontSize: '1rem' }}>
              امسح هذا الرمز للوصول إلى البروفايل مباشرة
            </p>
            <button 
              onClick={downloadQRCode} 
              style={{
                marginTop: '25px',
                padding: '14px 35px',
                background: 'white',
                color: '#0066ff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '700',
                fontFamily: 'Cairo, sans-serif'
              }}
            >
              <FaDownload style={{ marginLeft: '8px' }} />
              تحميل QR Code
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 30px',
            background: '#f3f4f6',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            <FaArrowLeft />
            العودة للصفحة الرئيسية
          </Link>
        </div>

        {/* User Events Section */}
        <UserEvents userId={id} />

        {/* User Tasks Section */}
        <UserTasks userId={id} userInfo={userData} />
      </div>
    </div>
  );
}

export default Profile;
