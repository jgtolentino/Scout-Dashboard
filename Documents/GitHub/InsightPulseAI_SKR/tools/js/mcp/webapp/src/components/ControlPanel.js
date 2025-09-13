import React, { useState } from 'react';
import './ControlPanel.css';

const ControlPanel = ({ mcpStatus, createRobot, changeRobotColor, robotCreated }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedColor, setSelectedColor] = useState('blue');
  
  const colorSchemes = [
    { id: 'blue', name: 'Blue (Default)', primary: '#0078d7', secondary: '#16b9ac' },
    { id: 'red', name: 'Red Alert', primary: '#d70000', secondary: '#ff9e22' },
    { id: 'green', name: 'Eco Green', primary: '#00aa55', secondary: '#88dfaa' },
    { id: 'purple', name: 'Quantum Purple', primary: '#9c27b0', secondary: '#e1bee7' },
    { id: 'dark', name: 'Stealth Mode', primary: '#212121', secondary: '#757575' },
  ];
  
  const handleColorChange = () => {
    changeRobotColor(selectedColor);
  };
  
  return (
    <div className="control-panel-container">
      <div className="tabs">
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button 
          className={activeTab === 'modify' ? 'active' : ''} 
          onClick={() => setActiveTab('modify')}
          disabled={!robotCreated}
        >
          Modify
        </button>
        <button 
          className={activeTab === 'animate' ? 'active' : ''} 
          onClick={() => setActiveTab('animate')}
          disabled={!robotCreated}
        >
          Animate
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'create' && (
          <div className="create-tab">
            <p>Create a 3D model of the Pulser robot mascot with customizable features.</p>
            <button 
              className="create-button" 
              onClick={createRobot}
              disabled={mcpStatus !== 'connected' || robotCreated}
            >
              {robotCreated ? 'Robot Created' : 'Create Pulser Robot'}
            </button>
            
            {mcpStatus === 'disconnected' && (
              <div className="warning">
                MCP server is not connected. Start the server to create the robot.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'modify' && (
          <div className="modify-tab">
            <div className="control-group">
              <label>Color Scheme:</label>
              <div className="color-options">
                {colorSchemes.map(scheme => (
                  <div 
                    key={scheme.id}
                    className={`color-option ${selectedColor === scheme.id ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(scheme.id)}
                  >
                    <div 
                      className="color-preview" 
                      style={{ 
                        background: `linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.primary} 50%, ${scheme.secondary} 50%, ${scheme.secondary} 100%)` 
                      }}
                    />
                    <span>{scheme.name}</span>
                  </div>
                ))}
              </div>
              <button 
                className="apply-button"
                onClick={handleColorChange}
                disabled={mcpStatus !== 'connected'}
              >
                Apply Color
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'animate' && (
          <div className="animate-tab">
            <p>Animation controls coming soon!</p>
            <div className="animation-controls">
              <div className="control-group">
                <label>Animation Type:</label>
                <select disabled>
                  <option>Idle</option>
                  <option>Wave</option>
                  <option>Dance</option>
                  <option>Thinking</option>
                </select>
              </div>
              <div className="control-group">
                <label>Speed:</label>
                <input type="range" min="0" max="100" defaultValue="50" disabled />
              </div>
              <button className="apply-button" disabled>
                Start Animation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;