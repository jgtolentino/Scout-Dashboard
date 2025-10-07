import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import Split from 'react-split';
import axios from 'axios';
import './App.css';
import 'xterm/css/xterm.css';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FooterStatus from './components/FooterStatus';
import EditorTabs from './components/EditorTabs';
import PreviewPane from './components/PreviewPane';
import TerminalPane from './components/TerminalPane';
import AIAssistant from './components/AIAssistant';
import WorkspaceSelector from './components/WorkspaceSelector';
import CreateWorkspace from './components/CreateWorkspace';

// Context
import { WorkspaceProvider } from './context/WorkspaceContext';
import { EditorProvider } from './context/EditorContext';
import { TerminalProvider } from './context/TerminalContext';
import { AIProvider } from './context/AIContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

function App() {
  return (
    <Router>
      <WorkspaceProvider>
        <EditorProvider>
          <TerminalProvider>
            <AIProvider>
              <div className="app">
                <Routes>
                  <Route path="/" element={<WorkspaceSelector />} />
                  <Route path="/create" element={<CreateWorkspace />} />
                  <Route path="/workspace/:workspaceId" element={<WorkspaceUI />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </AIProvider>
          </TerminalProvider>
        </EditorProvider>
      </WorkspaceProvider>
    </Router>
  );
}

function WorkspaceUI() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [mcpStatus, setMcpStatus] = useState('disconnected');
  const [layoutMode, setLayoutMode] = useState('split-horizontal'); // 'split-horizontal', 'split-vertical', 'editor-only', 'preview-only'
  
  // Check MCP status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/status`);
        setMcpStatus(response.data.mcp_connected ? 'connected' : 'disconnected');
      } catch (error) {
        setMcpStatus('disconnected');
        console.error('Failed to check MCP status:', error);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Toggle AI Assistant
  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
  };
  
  // Change layout mode
  const changeLayout = (mode) => {
    setLayoutMode(mode);
  };
  
  return (
    <>
      <Header 
        toggleAIAssistant={toggleAIAssistant} 
        changeLayout={changeLayout} 
        layoutMode={layoutMode}
      />
      
      <div className="main-container">
        <Sidebar />
        
        <div className="editor-container">
          <EditorTabs />
          
          {layoutMode === 'editor-only' && (
            <div className="editor-wrapper">
              <EditorComponent />
            </div>
          )}
          
          {layoutMode === 'preview-only' && (
            <div className="preview-wrapper">
              <PreviewPane />
            </div>
          )}
          
          {layoutMode === 'split-horizontal' && (
            <Split 
              className="split-horizontal"
              sizes={[50, 50]}
              minSize={100}
              gutterSize={8}
              direction="horizontal"
            >
              <div className="editor-wrapper">
                <EditorComponent />
              </div>
              <div className="preview-wrapper">
                <PreviewPane />
              </div>
            </Split>
          )}
          
          {layoutMode === 'split-vertical' && (
            <Split 
              className="split-vertical"
              sizes={[70, 30]}
              minSize={100}
              gutterSize={8}
              direction="vertical"
            >
              <div className="editor-wrapper">
                <EditorComponent />
              </div>
              <div className="preview-wrapper">
                <PreviewPane />
              </div>
            </Split>
          )}
          
          <TerminalPane />
        </div>
        
        {showAIAssistant && (
          <AIAssistant onClose={toggleAIAssistant} />
        )}
      </div>
      
      <FooterStatus mcpStatus={mcpStatus} />
    </>
  );
}

function EditorComponent() {
  const { activeFile, files, updateFile } = React.useContext(EditorContext);
  const [value, setValue] = useState('');
  const [language, setLanguage] = useState('javascript');
  
  useEffect(() => {
    if (activeFile && files[activeFile]) {
      setValue(files[activeFile].content);
      
      // Determine language from file extension
      const extension = activeFile.split('.').pop().toLowerCase();
      switch (extension) {
        case 'js':
          setLanguage('javascript');
          break;
        case 'py':
          setLanguage('python');
          break;
        case 'html':
          setLanguage('html');
          break;
        case 'css':
          setLanguage('css');
          break;
        case 'json':
          setLanguage('json');
          break;
        default:
          setLanguage('plaintext');
      }
    } else {
      setValue('');
    }
  }, [activeFile, files]);
  
  const handleEditorChange = (value) => {
    setValue(value);
    if (activeFile) {
      updateFile(activeFile, value);
    }
  };
  
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        rulers: [],
        wordWrap: 'on',
        wrappingIndent: 'same',
        automaticLayout: true
      }}
    />
  );
}

export default App;