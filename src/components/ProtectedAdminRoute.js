import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedAdminRoute({ children }) {
  useEffect(() => {
    // Check authentication status
    const session = sessionStorage.getItem('admin_face_session');
    if (!session) {
      console.log('User not authenticated, redirecting to admin login');
    }
  }, []);

  // Check if admin is authenticated via face recognition
  const isAuthenticated = () => {
    const session = sessionStorage.getItem('admin_face_session');
    if (!session) return false;

    try {
      const authSession = JSON.parse(session);
      // Session is valid (no expiration for now, but can be added)
      return true;
    } catch (error) {
      return false;
    }
  };

  // If not authenticated, redirect to admin login
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the protected component
  return children;
}

export default ProtectedAdminRoute;
