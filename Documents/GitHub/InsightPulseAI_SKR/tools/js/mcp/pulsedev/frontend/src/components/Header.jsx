import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceContext } from '../context/WorkspaceContext';
import './Header.css';

const Header = ({ toggleAIAssistant, changeLayout, layoutMode }) => {
  const { workspace } = useContext(WorkspaceContext);
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo" onClick={handleGoHome}>
          <img src="/logo.svg" alt="PulseDev" className="logo-img" />
          <span className="logo-text">PulseDev</span>
        </div>
        
        {workspace && (
          <div className="workspace-info">
            <span className="workspace-name">{workspace.name}</span>
          </div>
        )}
      </div>
      
      <div className="header-middle">
        {workspace && (
          <div className="layout-controls">
            <button 
              className={`layout-button ${layoutMode === 'editor-only' ? 'active' : ''}`}
              onClick={() => changeLayout('editor-only')}
              title="Editor Only"
            >
              <i className="icon-code"></i>
            </button>
            <button 
              className={`layout-button ${layoutMode === 'preview-only' ? 'active' : ''}`}
              onClick={() => changeLayout('preview-only')}
              title="Preview Only"
            >
              <i className="icon-preview"></i>
            </button>
            <button 
              className={`layout-button ${layoutMode === 'split-horizontal' ? 'active' : ''}`}
              onClick={() => changeLayout('split-horizontal')}
              title="Split Horizontal"
            >
              <i className="icon-split-horizontal"></i>
            </button>
            <button 
              className={`layout-button ${layoutMode === 'split-vertical' ? 'active' : ''}`}
              onClick={() => changeLayout('split-vertical')}
              title="Split Vertical"
            >
              <i className="icon-split-vertical"></i>
            </button>
          </div>
        )}
      </div>
      
      <div className="header-right">
        {workspace && (
          <>
            <button 
              className="ai-assistant-button"
              onClick={toggleAIAssistant}
              title="AI Assistant"
            >
              <i className="icon-assistant"></i>
              <span>AI Assistant</span>
            </button>
            
            <div className="user-profile">
              <button className="profile-button">
                <i className="icon-user"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;