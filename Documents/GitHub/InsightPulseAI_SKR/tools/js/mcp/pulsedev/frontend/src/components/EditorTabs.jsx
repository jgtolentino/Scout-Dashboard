import React, { useContext } from 'react';
import { EditorContext } from '../context/EditorContext';
import './EditorTabs.css';

const EditorTabs = () => {
  const { openFiles, activeFile, setActiveFile, closeFile } = useContext(EditorContext);
  
  // Get icon for file based on extension
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'js':
      case 'jsx':
        return '📜';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'py':
        return '🐍';
      default:
        return '📄';
    }
  };
  
  // Get the file name from a path
  const getFileName = (path) => {
    return path.split('/').pop();
  };
  
  // Switch to a tab
  const switchTab = (file) => {
    setActiveFile(file);
  };
  
  // Close a tab
  const handleCloseTab = (e, file) => {
    e.stopPropagation();
    closeFile(file);
  };
  
  if (openFiles.length === 0) {
    return (
      <div className="editor-tabs">
        <div className="empty-tabs">
          <span className="empty-tabs-text">No files open</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="editor-tabs">
      <div className="tabs-container">
        {openFiles.map((file) => (
          <div 
            key={file} 
            className={`tab ${activeFile === file ? 'active' : ''}`}
            onClick={() => switchTab(file)}
          >
            <div className="tab-content">
              <span className="tab-icon">{getFileIcon(file)}</span>
              <span className="tab-name">{getFileName(file)}</span>
              <button 
                className="tab-close"
                onClick={(e) => handleCloseTab(e, file)}
              >
                <i className="icon-close"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorTabs;