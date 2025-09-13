import React from 'react';
import '../../styles/Navbar.css';

/**
 * Navbar - Top navigation bar with app switching capabilities
 * Shared across all modes: deck, webapp, and mobile
 */
const Navbar = ({ currentMode, onSwitchMode, onNewProject, projectName }) => {
  return (
    <nav className="main-navbar">
      <div className="navbar-logo">
        <img src="/logo.svg" alt="Pulser" className="logo-image" />
        <span className="logo-text">Pulser</span>
      </div>
      
      <div className="navbar-title">
        {projectName ? (
          <span className="project-name">{projectName}</span>
        ) : (
          <span className="no-project">No Project Open</span>
        )}
      </div>
      
      <div className="navbar-modes">
        <button 
          className={`mode-button ${currentMode === 'deck' ? 'active' : ''}`}
          onClick={() => onSwitchMode('deck')}
        >
          <span className="mode-icon">🖼️</span>
          <span className="mode-label">Deck</span>
        </button>
        
        <button 
          className={`mode-button ${currentMode === 'webapp' ? 'active' : ''}`}
          onClick={() => onSwitchMode('webapp')}
        >
          <span className="mode-icon">🌐</span>
          <span className="mode-label">WebApp</span>
        </button>
        
        <button 
          className={`mode-button ${currentMode === 'mobile' ? 'active' : ''}`}
          onClick={() => onSwitchMode('mobile')}
        >
          <span className="mode-icon">📱</span>
          <span className="mode-label">Mobile</span>
        </button>
      </div>
      
      <div className="navbar-actions">
        <button className="new-project-button" onClick={onNewProject}>
          <span className="button-icon">+</span>
          New Project
        </button>
        
        <div className="user-menu">
          <img src="/avatar.png" alt="User" className="user-avatar" />
          <span className="user-name">User</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;