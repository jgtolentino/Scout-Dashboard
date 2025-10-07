import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceContext } from '../context/WorkspaceContext';
import './CreateWorkspace.css';

const TEMPLATES = [
  {
    id: 'react',
    name: 'React.js App',
    description: 'Modern React application with hooks, router, and components',
    icon: '⚛️'
  },
  {
    id: 'node',
    name: 'Node.js Backend',
    description: 'Express.js API server with MongoDB integration',
    icon: '📦'
  },
  {
    id: 'python',
    name: 'Python Project',
    description: 'Python application with FastAPI and virtual environment',
    icon: '🐍'
  },
  {
    id: 'web',
    name: 'Web App',
    description: 'Simple web application with HTML, CSS, and JavaScript',
    icon: '🌐'
  },
  {
    id: 'blank',
    name: 'Empty Project',
    description: 'Start from scratch with an empty workspace',
    icon: '📝'
  }
];

const CreateWorkspace = () => {
  const { createWorkspace, isLoading, error } = useContext(WorkspaceContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [nameError, setNameError] = useState('');
  const [templateError, setTemplateError] = useState('');
  
  const validate = () => {
    let valid = true;
    
    if (!name.trim()) {
      setNameError('Workspace name is required');
      valid = false;
    } else if (name.length > 50) {
      setNameError('Workspace name must be less than 50 characters');
      valid = false;
    } else {
      setNameError('');
    }
    
    if (!selectedTemplate) {
      setTemplateError('Please select a template');
      valid = false;
    } else {
      setTemplateError('');
    }
    
    return valid;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    createWorkspace(name, {
      template: selectedTemplate,
      description
    });
  };
  
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setTemplateError('');
  };
  
  return (
    <div className="create-workspace">
      <div className="create-header">
        <Link to="/" className="back-button">
          <i className="icon-arrow-left"></i>
          Back to Workspaces
        </Link>
        <h1>Create a New Workspace</h1>
      </div>
      
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-field">
            <label htmlFor="name">Workspace Name</label>
            <input
              type="text"
              id="name"
              className={`form-input ${nameError ? 'error' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
              placeholder="My Awesome Project"
              disabled={isLoading}
              maxLength={50}
            />
            {nameError && <div className="error-message">{nameError}</div>}
            <div className="character-count">{name.length}/50</div>
          </div>
          
          <div className="form-field">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your project..."
              disabled={isLoading}
              maxLength={200}
              rows={3}
            />
            <div className="character-count">{description.length}/200</div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h2>Select a Template</h2>
            {templateError && <div className="error-message">{templateError}</div>}
          </div>
          
          <div className="templates-grid">
            {TEMPLATES.map(template => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
                {selectedTemplate === template.id && (
                  <div className="template-selected-indicator">
                    <i className="icon-check"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="form-error">
            <i className="icon-error"></i>
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-actions">
          <Link to="/" className="cancel-button">
            Cancel
          </Link>
          <button
            type="submit"
            className="create-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner-small"></div>
                Creating...
              </>
            ) : (
              <>
                <i className="icon-plus"></i>
                Create Workspace
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkspace;