import React from 'react';
import '../../styles/StatusBar.css';

/**
 * StatusBar - Bottom status bar with contextual information
 * Displays status messages, loading indicators, and mode-specific information
 */
const StatusBar = ({ mode, status, isLoading }) => {
  // Get mode-specific status info
  const getModeInfo = () => {
    switch (mode) {
      case 'deck':
        return 'SlideForge Mode • Powered by Claude Max';
      case 'webapp':
        return 'WebApp IDE Mode • React + Tailwind';
      case 'mobile':
        return 'Mobile App Mode • React Native + Expo';
      default:
        return 'Pulser Builder';
    }
  };
  
  // Determine status color based on loading state
  const getStatusClass = () => {
    if (isLoading) return 'status-loading';
    return 'status-ready';
  };
  
  return (
    <div className={`status-bar ${mode}-status`}>
      <div className="status-section mode-info">
        {getModeInfo()}
      </div>
      
      <div className={`status-section status-message ${getStatusClass()}`}>
        {isLoading ? (
          <>
            <div className="status-spinner"></div>
            {status || 'Loading...'}
          </>
        ) : (
          <>
            <div className="status-indicator"></div>
            {status || 'Ready'}
          </>
        )}
      </div>
      
      <div className="status-section version-info">
        Pulser v2.2.1
      </div>
    </div>
  );
};

export default StatusBar;