import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';
import FaceRecognitionLogin from './components/FaceRecognitionLogin';
import AdminDashboard from './components/ModernAdminDashboard';
import PendingRegistrations from './components/PendingRegistrations';
import QRScanner from './components/QRScanner';
import EventsManagement from './components/EventsManagement';
import AttendanceLogs from './components/AttendanceLogs';
import GovernoratesView from './components/GovernoratesView';
import GovernorateDetails from './components/GovernorateDetails';
import CommitteeMembers from './components/CommitteeMembers';
import AdminTasks from './components/AdminTasks';
import UnauthorizedAttempts from './components/UnauthorizedAttempts';
import UserDashboard from './components/UserDashboard';
import SecuritySettings from './components/SecuritySettings';
import AdminSettings from './components/AdminSettings';
import Analytics from './components/Analytics';
import EnhancedProfile from './components/EnhancedProfile';
import QRCodePage from './components/QRCodePage';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import './App.css';
import './AdminStyles.css';
import './EnhancedAnimations.css';
import './styles/ModernTheme.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<RegistrationForm />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile/:governorate/:id" element={<EnhancedProfile />} />
          <Route path="/qr-code/:governorate/:id" element={<QRCodePage />} />
          <Route path="/security-settings/:userId" element={<SecuritySettings />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<FaceRecognitionLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/analytics" element={<ProtectedAdminRoute><Analytics /></ProtectedAdminRoute>} />
          <Route path="/admin/pending" element={<ProtectedAdminRoute><PendingRegistrations /></ProtectedAdminRoute>} />
          <Route path="/admin/scanner" element={<ProtectedAdminRoute><QRScanner /></ProtectedAdminRoute>} />
          <Route path="/admin/events" element={<ProtectedAdminRoute><EventsManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/attendance" element={<ProtectedAdminRoute><AttendanceLogs /></ProtectedAdminRoute>} />
          <Route path="/admin/tasks" element={<ProtectedAdminRoute><AdminTasks /></ProtectedAdminRoute>} />
          <Route path="/admin/unauthorized-attempts" element={<ProtectedAdminRoute><UnauthorizedAttempts /></ProtectedAdminRoute>} />
          <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
          <Route path="/admin/governorates" element={<ProtectedAdminRoute><GovernoratesView /></ProtectedAdminRoute>} />
          <Route path="/admin/governorate/:governorate" element={<ProtectedAdminRoute><GovernorateDetails /></ProtectedAdminRoute>} />
          <Route path="/admin/governorate/:governorate/committee/:committee" element={<ProtectedAdminRoute><CommitteeMembers /></ProtectedAdminRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
