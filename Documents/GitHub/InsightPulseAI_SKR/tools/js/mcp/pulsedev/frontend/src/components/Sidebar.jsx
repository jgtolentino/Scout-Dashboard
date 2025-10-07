import React, { useState, useContext } from 'react';
import { EditorContext } from '../context/EditorContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import './Sidebar.css';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const { fileTree, openFile, createFile, deleteFile } = useContext(EditorContext);
  const { workspace } = useContext(WorkspaceContext);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [newItemInput, setNewItemInput] = useState({ visible: false, parentPath: '', type: 'file', name: '' });
  
  // Show context menu for an item
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item
    });
  };
  
  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };
  
  // Show input for creating new file or directory
  const showNewItemInput = (parentPath, type) => {
    setNewItemInput({
      visible: true,
      parentPath,
      type,
      name: ''
    });
    closeContextMenu();
  };
  
  // Handle creating new file or directory
  const handleCreateItem = () => {
    const { parentPath, type, name } = newItemInput;
    if (!name) return;
    
    const path = parentPath ? `${parentPath}/${name}` : name;
    
    if (type === 'file') {
      createFile(path, '');
    } else {
      // Directory creation would go here
      console.log('Creating directory:', path);
    }
    
    setNewItemInput({ visible: false, parentPath: '', type: 'file', name: '' });
  };
  
  // Handle deleting a file or directory
  const handleDeleteItem = (item) => {
    if (item.type === 'file') {
      deleteFile(item.path);
    } else {
      // Directory deletion would go here
      console.log('Deleting directory:', item.path);
    }
    closeContextMenu();
  };
  
  // Render file tree recursively
  const renderFileTree = (items, parentPath = '') => {
    return (
      <ul className="file-tree">
        {items.map((item, index) => {
          const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          const isDirectory = item.type === 'directory';
          
          return (
            <li key={index} className={`file-tree-item ${isDirectory ? 'directory' : 'file'}`}>
              <div 
                className="file-tree-item-content"
                onClick={() => isDirectory ? null : openFile(itemPath)}
                onContextMenu={(e) => handleContextMenu(e, { ...item, path: itemPath })}
              >
                <span className="file-icon">
                  {isDirectory ? '📁' : getFileIcon(item.name)}
                </span>
                <span className="file-name">{item.name}</span>
              </div>
              
              {isDirectory && item.children && renderFileTree(item.children, itemPath)}
            </li>
          );
        })}
        
        {newItemInput.visible && newItemInput.parentPath === parentPath && (
          <li className="file-tree-item new-item">
            <div className="file-tree-item-content">
              <span className="file-icon">
                {newItemInput.type === 'file' ? '📄' : '📁'}
              </span>
              <input
                type="text"
                autoFocus
                value={newItemInput.name}
                onChange={(e) => setNewItemInput({ ...newItemInput, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateItem();
                  if (e.key === 'Escape') setNewItemInput({ visible: false, parentPath: '', type: 'file', name: '' });
                }}
                onBlur={() => setNewItemInput({ visible: false, parentPath: '', type: 'file', name: '' })}
                placeholder={`New ${newItemInput.type}...`}
              />
            </div>
          </li>
        )}
      </ul>
    );
  };
  
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
  
  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab-button ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
          title="Explorer"
        >
          <i className="icon-explorer"></i>
        </button>
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          title="Search"
        >
          <i className="icon-search"></i>
        </button>
        <button 
          className={`tab-button ${activeTab === 'git' ? 'active' : ''}`}
          onClick={() => setActiveTab('git')}
          title="Source Control"
        >
          <i className="icon-git"></i>
        </button>
        <button 
          className={`tab-button ${activeTab === 'extensions' ? 'active' : ''}`}
          onClick={() => setActiveTab('extensions')}
          title="Extensions"
        >
          <i className="icon-extensions"></i>
        </button>
      </div>
      
      <div className="sidebar-content">
        {activeTab === 'explorer' && (
          <div className="explorer-panel">
            <div className="panel-header">
              <h3>EXPLORER</h3>
              <div className="panel-actions">
                <button 
                  className="action-button"
                  title="New File"
                  onClick={() => showNewItemInput('', 'file')}
                >
                  <i className="icon-new-file"></i>
                </button>
                <button 
                  className="action-button"
                  title="New Folder"
                  onClick={() => showNewItemInput('', 'directory')}
                >
                  <i className="icon-new-folder"></i>
                </button>
                <button 
                  className="action-button"
                  title="Refresh"
                >
                  <i className="icon-refresh"></i>
                </button>
                <button 
                  className="action-button"
                  title="Collapse"
                >
                  <i className="icon-collapse"></i>
                </button>
              </div>
            </div>
            
            <div className="workspace-explorer">
              {workspace && (
                <>
                  <div className="workspace-header">
                    <h4>{workspace.name}</h4>
                  </div>
                  
                  {fileTree.length > 0 ? (
                    renderFileTree(fileTree)
                  ) : (
                    <div className="empty-state">
                      <p>No files yet. Create a new file to get started.</p>
                      <button 
                        className="new-file-button"
                        onClick={() => showNewItemInput('', 'file')}
                      >
                        New File
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="search-panel">
            <div className="panel-header">
              <h3>SEARCH</h3>
            </div>
            <div className="search-input-container">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search in files..." 
              />
            </div>
            <div className="search-results">
              <p className="text-muted">Type to search in your workspace</p>
            </div>
          </div>
        )}
        
        {activeTab === 'git' && (
          <div className="git-panel">
            <div className="panel-header">
              <h3>SOURCE CONTROL</h3>
            </div>
            <div className="git-content">
              <p className="text-muted">
                Git features will be available in a future release.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'extensions' && (
          <div className="extensions-panel">
            <div className="panel-header">
              <h3>EXTENSIONS</h3>
            </div>
            <div className="extensions-content">
              <p className="text-muted">
                Extensions will be available in a future release.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={closeContextMenu}
        >
          <ul>
            {contextMenu.item.type === 'directory' && (
              <>
                <li onClick={() => showNewItemInput(contextMenu.item.path, 'file')}>New File</li>
                <li onClick={() => showNewItemInput(contextMenu.item.path, 'directory')}>New Folder</li>
                <li className="divider"></li>
              </>
            )}
            <li onClick={() => handleDeleteItem(contextMenu.item)}>Delete</li>
            <li onClick={() => console.log('Rename:', contextMenu.item.path)}>Rename</li>
          </ul>
        </div>
      )}
      
      {/* Overlay to close context menu when clicking elsewhere */}
      {contextMenu.visible && (
        <div 
          className="context-menu-overlay"
          onClick={closeContextMenu}
        />
      )}
    </div>
  );
};

export default Sidebar;