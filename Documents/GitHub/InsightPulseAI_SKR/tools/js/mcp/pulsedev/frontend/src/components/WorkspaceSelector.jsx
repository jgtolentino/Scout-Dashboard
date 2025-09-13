import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceContext } from '../context/WorkspaceContext';
import './WorkspaceSelector.css';

const WorkspaceSelector = () => {
  const { workspaces, loadWorkspaces, isLoading, error } = useContext(WorkspaceContext);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    loadWorkspaces();
  }, []);
  
  // Filter workspaces based on search input
  const filteredWorkspaces = workspaces.filter(workspace => 
    workspace.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Format timestamp to a readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="workspace-selector">
      <div className="workspace-header">
        <div className="logo-container">
          <div className="logo">🧩</div>
          <h1>PulseDev</h1>
        </div>
        
        <p className="subtitle">Cloud IDE powered by MCP architecture</p>
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search workspaces..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <i className="icon-search"></i>
        </div>
      </div>
      
      <div className="workspace-actions">
        <Link to="/create" className="create-button">
          <i className="icon-plus"></i>
          Create Workspace
        </Link>
        
        {isLoading ? (
          <div className="loading-status">Loading...</div>
        ) : null}
      </div>
      
      {error && (
        <div className="error-banner">
          <i className="icon-error"></i>
          <span>{error}</span>
        </div>
      )}
      
      <div className="workspaces-list">
        <div className="list-header">
          <div className="list-header-name">Name</div>
          <div className="list-header-template">Template</div>
          <div className="list-header-date">Last Modified</div>
        </div>
        
        {isLoading && filteredWorkspaces.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="empty-list">
            <div className="empty-icon">🔍</div>
            <h3>No workspaces found</h3>
            {filter ? (
              <p>No workspaces match your search. Try a different search term or create a new workspace.</p>
            ) : (
              <p>You don't have any workspaces yet. Create your first workspace to get started.</p>
            )}
            <Link to="/create" className="empty-create-button">
              Create Workspace
            </Link>
          </div>
        ) : (
          <>
            {filteredWorkspaces.map(workspace => (
              <Link 
                key={workspace.id} 
                to={`/workspace/${workspace.id}`}
                className="workspace-item"
              >
                <div className="workspace-name">
                  <div className="workspace-icon">{getWorkspaceIcon(workspace.template)}</div>
                  <div className="workspace-info">
                    <div className="workspace-title">{workspace.name}</div>
                    <div className="workspace-description">{workspace.description || ''}</div>
                  </div>
                </div>
                <div className="workspace-template">
                  {getTemplateName(workspace.template)}
                </div>
                <div className="workspace-date">
                  {formatDate(workspace.modified_at || workspace.created_at)}
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to get appropriate icon for workspace template
const getWorkspaceIcon = (template) => {
  switch (template) {
    case 'react':
      return '⚛️';
    case 'node':
      return '📦';
    case 'python':
      return '🐍';
    case 'web':
      return '🌐';
    case 'blank':
      return '📝';
    default:
      return '📁';
  }
};

// Helper function to get template display name
const getTemplateName = (template) => {
  switch (template) {
    case 'react':
      return 'React.js App';
    case 'node':
      return 'Node.js Backend';
    case 'python':
      return 'Python Project';
    case 'web':
      return 'Web App (HTML/CSS/JS)';
    case 'blank':
      return 'Empty Project';
    default:
      return template ? template.charAt(0).toUpperCase() + template.slice(1) : 'Custom';
  }
};

export default WorkspaceSelector;