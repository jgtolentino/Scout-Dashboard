import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WorkspaceSelector from './components/WorkspaceSelector';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Preview from './components/Preview';
import FileExplorer from './components/FileExplorer';
import AIAssistant from './components/AIAssistant';
import Spinner from './components/Spinner';

// Hooks
import { useWorkspace } from './contexts/WorkspaceContext';

// Styles
import './App.css';

const App: React.FC = () => {
  const { activeWorkspace, loading } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleAIAssistant = () => {
    setAiAssistantOpen(!aiAssistantOpen);
  };

  return (
    <div className="app-container">
      <Header 
        toggleSidebar={toggleSidebar} 
        toggleAIAssistant={toggleAIAssistant}
      />
      
      <div className="main-container">
        {sidebarOpen && (
          <div className="sidebar">
            <Sidebar />
          </div>
        )}
        
        <div className="content-area">
          <Routes>
            <Route 
              path="/" 
              element={
                loading ? (
                  <div className="loading-container">
                    <Spinner />
                    <p>Loading workspaces...</p>
                  </div>
                ) : (
                  <WorkspaceSelector />
                )
              } 
            />
            
            <Route 
              path="/workspace/:workspaceId/*" 
              element={
                activeWorkspace ? (
                  <div className="workspace-container">
                    <div className="workspace-top">
                      <div className="file-explorer-panel">
                        <FileExplorer />
                      </div>
                      <div className="editor-panel">
                        <Editor />
                      </div>
                      {aiAssistantOpen && (
                        <div className="ai-assistant-panel">
                          <AIAssistant />
                        </div>
                      )}
                    </div>
                    <div className="workspace-bottom">
                      <div className="terminal-panel">
                        <Terminal />
                      </div>
                      <div className="preview-panel">
                        <Preview />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;