import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function AdminBypass() {
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    // Secret token to bypass security
    const SECRET_TOKEN = 'YLY_BYPASS_2024';

    if (token === SECRET_TOKEN) {
      // Create a fake admin session
      sessionStorage.setItem('admin_face_session', JSON.stringify({
        adminName: 'Bypass Admin',
        authenticatedAt: new Date().toISOString(),
        loginMethod: 'bypass'
      }));

      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } else {
      // Invalid token, redirect to login
      navigate('/admin/login');
    }
  }, [token, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1d29',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'Cairo, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #2d3748',
          borderTopColor: '#5b6ee1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>جاري التحقق من الصلاحيات...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminBypass;
