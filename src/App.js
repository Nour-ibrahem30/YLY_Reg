import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import QRScanner from './components/QRScanner';
import EventsManagement from './components/EventsManagement';
import AttendanceLogs from './components/AttendanceLogs';
import './App.css';
import './AdminStyles.css';

// Test Supabase connection in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/testSupabase');
}

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/profile/:governorate/:id" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/scanner" element={<QRScanner />} />
          <Route path="/admin/events" element={<EventsManagement />} />
          <Route path="/admin/attendance" element={<AttendanceLogs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
