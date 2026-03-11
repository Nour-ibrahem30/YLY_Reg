import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/ModernAdminDashboard';
import PendingRegistrations from './components/PendingRegistrations';
import QRScanner from './components/QRScanner';
import EventsManagement from './components/EventsManagement';
import AttendanceLogs from './components/AttendanceLogs';
import GovernoratesView from './components/GovernoratesView';
import GovernorateDetails from './components/GovernorateDetails';
import CommitteeMembers from './components/CommitteeMembers';
import AdminTasks from './components/AdminTasks';
import UserDashboard from './components/UserDashboard';
import SecuritySettings from './components/SecuritySettings';
import EnhancedProfile from './components/EnhancedProfile';
import QRCodePage from './components/QRCodePage';
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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pending" element={<PendingRegistrations />} />
          <Route path="/admin/scanner" element={<QRScanner />} />
          <Route path="/admin/events" element={<EventsManagement />} />
          <Route path="/admin/attendance" element={<AttendanceLogs />} />
          <Route path="/admin/tasks" element={<AdminTasks />} />
          <Route path="/admin/governorates" element={<GovernoratesView />} />
          <Route path="/admin/governorate/:governorate" element={<GovernorateDetails />} />
          <Route path="/admin/governorate/:governorate/committee/:committee" element={<CommitteeMembers />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
