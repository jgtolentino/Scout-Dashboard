import React from 'react';
import '../../styles/Sidebar.css';

/**
 * Sidebar - Left navigation sidebar with mode-specific tools
 * Adapts its content based on the current mode (deck, webapp, mobile)
 */
const Sidebar = ({ mode }) => {
  // Define tools for each mode
  const modeTools = {
    deck: [
      { id: 'slides', icon: '📑', label: 'Slides' },
      { id: 'elements', icon: '🧩', label: 'Elements' },
      { id: 'themes', icon: '🎨', label: 'Themes' },
      { id: 'transitions', icon: '🔄', label: 'Transitions' },
      { id: 'export', icon: '📤', label: 'Export' }
    ],
    webapp: [
      { id: 'files', icon: '📁', label: 'Files' },
      { id: 'components', icon: '🧩', label: 'Components' },
      { id: 'styles', icon: '🎨', label: 'Styles' },
      { id: 'assets', icon: '🖼️', label: 'Assets' },
      { id: 'deploy', icon: '🚀', label: 'Deploy' }
    ],
    mobile: [
      { id: 'screens', icon: '📱', label: 'Screens' },
      { id: 'components', icon: '🧩', label: 'Components' },
      { id: 'assets', icon: '🖼️', label: 'Assets' },
      { id: 'data', icon: '💾', label: 'Data' },
      { id: 'build', icon: '🚀', label: 'Build' }
    ]
  };
  
  // Get the tools for the current mode
  const tools = modeTools[mode] || [];
  
  // Define AI tools available in all modes
  const aiTools = [
    { id: 'ask-claude', icon: '🧠', label: 'Ask Claude' },
    { id: 'generate', icon: '✨', label: 'Generate' },
    { id: 'improve', icon: '📈', label: 'Improve' }
  ];
  
  return (
    <div className={`sidebar ${mode}-sidebar`}>
      <div className="tools-section">
        <h3 className="section-title">Tools</h3>
        <ul className="tool-list">
          {tools.map(tool => (
            <li key={tool.id} className="tool-item">
              <button className="tool-button">
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="tools-section ai-tools">
        <h3 className="section-title">AI Assistance</h3>
        <ul className="tool-list">
          {aiTools.map(tool => (
            <li key={tool.id} className="tool-item">
              <button className="tool-button">
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <button className="help-button">
          <span className="help-icon">❓</span>
          <span className="help-label">Help</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;