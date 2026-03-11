import React from 'react';
import { motion } from 'framer-motion';
import '../styles/StatsCard.css';

function StatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  color = 'primary',
  delay = 0 
}) {
  const colorClasses = {
    primary: 'stats-card-primary',
    accent: 'stats-card-accent',
    success: 'stats-card-success',
    warning: 'stats-card-warning',
    info: 'stats-card-info'
  };

  return (
    <motion.div 
      className={`stats-card ${colorClasses[color]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="stats-card-icon">
        <Icon />
      </div>
      
      <div className="stats-card-content">
        <div className="stats-card-title">{title}</div>
        <div className="stats-card-value">{value}</div>
        
        {subtitle && (
          <div className="stats-card-subtitle">{subtitle}</div>
        )}
        
        {trend && (
          <div className={`stats-card-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
            <span className="trend-icon">{trend === 'up' ? '↑' : '↓'}</span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StatsCard;
