import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import './App.css';
import './AdminStyles.css';

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RegistrationForm />} />
          <Route path="/profile/:governorate/:id" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
