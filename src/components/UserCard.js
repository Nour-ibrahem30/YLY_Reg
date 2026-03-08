import React from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPhone, FaUniversity } from 'react-icons/fa';

function UserCard({ user, index, onClick }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientColor = (index) => {
    const gradients = [
      'linear-gradient(135deg, #003DA5 0%, #002D7A 100%)', // YLY Blue
      'linear-gradient(135deg, #E31E24 0%, #B71C1C 100%)', // YLY Red
      'linear-gradient(135deg, #003DA5 0%, #E31E24 100%)', // Blue to Red
      'linear-gradient(135deg, #E31E24 0%, #003DA5 100%)', // Red to Blue
      'linear-gradient(135deg, #002D7A 0%, #B71C1C 100%)', // Dark Blue to Dark Red
      'linear-gradient(135deg, #0052CC 0%, #E31E24 100%)', // Light Blue to Red
      'linear-gradient(135deg, #003DA5 0%, #000000 100%)', // Blue to Black
      'linear-gradient(135deg, #E31E24 0%, #000000 100%)', // Red to Black
    ];
    return gradients[index % gradients.length];
  };

  return (
    <motion.div
      className="user-card"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 80,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.02,
        y: -15,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(user)}
    >
      <div className="user-card-body">
        <div className="user-badges">
          <motion.span 
            className="badge badge-governorate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            whileHover={{ scale: 1.15, rotate: -5 }}
          >
            {user.governorate}
          </motion.span>
          <motion.span 
            className="badge badge-committee"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.3 }}
            whileHover={{ scale: 1.15, rotate: 5 }}
          >
            {user.committee}
          </motion.span>
        </div>

        <motion.div 
          className="user-avatar"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: index * 0.08 + 0.1,
            type: "spring",
            stiffness: 200
          }}
          style={{ background: getGradientColor(index) }}
        >
          {getInitials(user.name)}
        </motion.div>

        <motion.h3 
          className="user-name"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 + 0.4 }}
        >
          {user.name}
        </motion.h3>
        
        <div className="user-info-grid">
          <motion.div 
            className="info-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.5 }}
            whileHover={{ x: -8 }}
          >
            <div className="info-icon">
              <FaEnvelope />
            </div>
            <span className="info-text">{user.email}</span>
          </motion.div>
          
          <motion.div 
            className="info-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.6 }}
            whileHover={{ x: -8 }}
          >
            <div className="info-icon">
              <FaPhone />
            </div>
            <span className="info-text">{user.number}</span>
          </motion.div>
          
          {user.university && (
            <motion.div 
              className="info-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 + 0.7 }}
              whileHover={{ x: -8 }}
            >
              <div className="info-icon">
                <FaUniversity />
              </div>
              <span className="info-text">{user.university}</span>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div 
        className="user-card-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.8 }}
      >
        <motion.span 
          className="badge badge-role"
          whileHover={{ scale: 1.15, rotate: -5 }}
        >
          {user.role || 'Member'}
        </motion.span>
        <span className="view-details">
          عرض التفاصيل 
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            →
          </motion.span>
        </span>
      </motion.div>
    </motion.div>
  );
}

export default UserCard;
