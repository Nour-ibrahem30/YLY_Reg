import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import PendingRegistrations from './components/PendingRegistrations';
import QRScanner from './components/QRScanner';
import EventsManagement from './components/EventsManagement';
import AttendanceLogs from './components/AttendanceLogs';
import GovernoratesView from './components/GovernoratesView';
import GovernorateDetails from './components/GovernorateDetails';
import CommitteeMembers from './components/CommitteeMembers';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './App.css';
import './AdminStyles.css';
import './EnhancedAnimations.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/profile/:governorate/:id" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/pending" element={<PendingRegistrations />} />
          <Route path="/admin/scanner" element={<QRScanner />} />
          <Route path="/admin/events" element={<EventsManagement />} />
          <Route path="/admin/attendance" element={<AttendanceLogs />} />
          <Route path="/admin/governorates" element={<GovernoratesView />} />
          <Route path="/admin/governorate/:governorate" element={<GovernorateDetails />} />
          <Route path="/admin/governorate/:governorate/committee/:committee" element={<CommitteeMembers />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
