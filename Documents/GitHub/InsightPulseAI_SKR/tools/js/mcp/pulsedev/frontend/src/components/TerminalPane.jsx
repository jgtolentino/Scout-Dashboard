import React, { useContext, useEffect, useRef, useState } from 'react';
import { TerminalContext } from '../context/TerminalContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import './TerminalPane.css';

const TerminalPane = () => {
  const { workspace } = useContext(WorkspaceContext);
  const { 
    sessions,
    activeSession,
    createSession,
    terminateSession,
    setActiveSession,
    initializeTerminal,
    executeCommand
  } = useContext(TerminalContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [initialY, setInitialY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  
  const terminalRef = useRef(null);
  const dragHandleRef = useRef(null);
  const paneRef = useRef(null);
  
  // Create a terminal session when workspace loads
  useEffect(() => {
    if (workspace && Object.keys(sessions).length === 0) {
      createSession();
    }
  }, [workspace, sessions]);
  
  // Initialize terminal when session is active
  useEffect(() => {
    if (activeSession && terminalRef.current) {
      initializeTerminal(activeSession, terminalRef.current);
    }
  }, [activeSession, terminalRef.current]);
  
  // Handle terminal drag resize
  const handleDragStart = (e) => {
    setIsDragging(true);
    setInitialY(e.clientY);
    setInitialHeight(paneRef.current.clientHeight);
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    e.preventDefault();
  };
  
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = initialY - e.clientY;
    const newHeight = Math.max(100, Math.min(window.innerHeight - 200, initialHeight + deltaY));
    setHeight(newHeight);
    e.preventDefault();
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // Toggle terminal collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Create a new terminal session
  const handleNewTerminal = () => {
    createSession();
  };
  
  // Close a terminal session
  const handleCloseTerminal = (e, sessionId) => {
    e.stopPropagation();
    terminateSession(sessionId);
  };
  
  // Switch to a terminal session
  const handleSwitchTerminal = (sessionId) => {
    setActiveSession(sessionId);
  };
  
  // Execute a command in the terminal (example for demo)
  const handleRunCommand = (command) => {
    executeCommand(command);
  };
  
  return (
    <div 
      ref={paneRef}
      className={`terminal-pane ${isCollapsed ? 'collapsed' : ''}`}
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
    >
      <div 
        ref={dragHandleRef}
        className="terminal-drag-handle" 
        onMouseDown={handleDragStart}
      >
        <div className="handle-icon"></div>
      </div>
      
      <div className="terminal-header">
        <div className="terminal-tabs">
          {Object.entries(sessions).map(([id, session]) => (
            <div 
              key={id}
              className={`terminal-tab ${activeSession === id ? 'active' : ''}`}
              onClick={() => handleSwitchTerminal(id)}
            >
              <span className="tab-name">Terminal {session.index || id.substr(0, 4)}</span>
              <button 
                className="tab-close"
                onClick={(e) => handleCloseTerminal(e, id)}
              >
                <i className="icon-close"></i>
              </button>
            </div>
          ))}
          <button 
            className="new-terminal-button"
            onClick={handleNewTerminal}
            title="New Terminal"
          >
            <i className="icon-plus"></i>
          </button>
        </div>
        
        <div className="terminal-actions">
          <button 
            className="terminal-action-button"
            onClick={() => handleRunCommand('clear')}
            title="Clear Terminal"
          >
            <i className="icon-clear"></i>
          </button>
          <button 
            className="terminal-action-button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Terminal' : 'Collapse Terminal'}
          >
            <i className={`icon-${isCollapsed ? 'expand' : 'collapse'}`}></i>
          </button>
        </div>
      </div>
      
      <div className="terminal-content">
        <div 
          ref={terminalRef}
          className="terminal-container"
        ></div>
      </div>
    </div>
  );
};

export default TerminalPane;