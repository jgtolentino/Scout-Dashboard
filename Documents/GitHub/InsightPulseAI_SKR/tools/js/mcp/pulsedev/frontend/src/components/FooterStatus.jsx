import React, { useContext } from 'react';
import { EditorContext } from '../context/EditorContext';
import { TerminalContext } from '../context/TerminalContext';
import './FooterStatus.css';

const FooterStatus = ({ mcpStatus }) => {
  const { activeFile } = useContext(EditorContext);
  const { status: terminalStatus } = useContext(TerminalContext);
  
  // Get file extension from active file
  const getFileExtension = () => {
    if (!activeFile) return '';
    
    const parts = activeFile.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return '';
  };

  // Get file language from extension
  const getLanguage = () => {
    if (!activeFile) return '';
    
    const extension = getFileExtension().toLowerCase();
    switch (extension) {
      case 'js':
        return 'JavaScript';
      case 'jsx':
        return 'React JSX';
      case 'ts':
        return 'TypeScript';
      case 'tsx':
        return 'React TSX';
      case 'py':
        return 'Python';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'json':
        return 'JSON';
      case 'md':
        return 'Markdown';
      default:
        return extension ? extension : 'Plain Text';
    }
  };
  
  return (
    <footer className="footer-status">
      <div className="status-left">
        <div className="status-item">
          <i className={`status-icon ${mcpStatus === 'connected' ? 'connected' : 'disconnected'}`}></i>
          <span>MCP: {mcpStatus}</span>
        </div>
        
        <div className="status-item">
          <i className={`status-icon ${terminalStatus === 'connected' ? 'connected' : 'disconnected'}`}></i>
          <span>Terminal: {terminalStatus}</span>
        </div>
      </div>
      
      <div className="status-right">
        {activeFile && (
          <>
            <div className="status-item">
              <span>{getLanguage()}</span>
            </div>
            
            <div className="status-item">
              <span>UTF-8</span>
            </div>
            
            <div className="status-item">
              <span>LF</span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
};

export default FooterStatus;