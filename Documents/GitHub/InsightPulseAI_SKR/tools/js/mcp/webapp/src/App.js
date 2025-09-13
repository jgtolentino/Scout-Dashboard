import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import axios from 'axios';
import './App.css';

// Lazy load components for better performance
const RobotViewer = React.lazy(() => import('./components/RobotViewer'));
const ControlPanel = React.lazy(() => import('./components/ControlPanel'));
const MCPConsole = React.lazy(() => import('./components/MCPConsole'));

function App() {
  const [mcpStatus, setMcpStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [robotCreated, setRobotCreated] = useState(false);
  const [robotImage, setRobotImage] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'image', 'console'
  
  // Check if MCP server is running
  useEffect(() => {
    const checkMcpStatus = async () => {
      try {
        const response = await axios.get('/api/status');
        if (response.data.status === 'running') {
          setMcpStatus('connected');
        }
      } catch (error) {
        setMcpStatus('disconnected');
        console.error('MCP server is not running:', error);
      }
    };
    
    checkMcpStatus();
    const interval = setInterval(checkMcpStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Add a message to the console
  const addMessage = (message, type = 'info') => {
    setMessages(prev => [...prev, { text: message, type, timestamp: new Date() }]);
  };

  // Create the Pulser robot
  const createRobot = async () => {
    try {
      addMessage('Creating Pulser robot...', 'command');
      setMcpStatus('working');
      
      const response = await axios.post('/api/blender/command', {
        command: 'create_pulser_robot',
        params: {
          render: true
        }
      });
      
      if (response.data.status === 'success') {
        addMessage('Pulser robot created successfully!', 'success');
        setRobotCreated(true);
        
        // If image data is included
        if (response.data.image_data) {
          setRobotImage(`data:image/png;base64,${response.data.image_data}`);
        }
      } else {
        addMessage(`Error creating robot: ${response.data.message}`, 'error');
      }
      
      setMcpStatus('connected');
    } catch (error) {
      addMessage(`Failed to create robot: ${error.message}`, 'error');
      setMcpStatus('connected');
    }
  };

  // Change robot color
  const changeRobotColor = async (colorScheme) => {
    try {
      addMessage(`Changing robot color to ${colorScheme}...`, 'command');
      setMcpStatus('working');
      
      const response = await axios.post('/api/blender/command', {
        command: 'change_robot_color',
        params: { colorScheme }
      });
      
      if (response.data.status === 'success') {
        addMessage('Robot color changed successfully!', 'success');
        
        // If image data is updated
        if (response.data.image_data) {
          setRobotImage(`data:image/png;base64,${response.data.image_data}`);
        }
      } else {
        addMessage(`Error changing color: ${response.data.message}`, 'error');
      }
      
      setMcpStatus('connected');
    } catch (error) {
      addMessage(`Failed to change color: ${error.message}`, 'error');
      setMcpStatus('connected');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-text">Pulser</span>
          <span className="logo-accent">Robot</span>
        </div>
        <div className={`mcp-status ${mcpStatus}`}>
          MCP Status: {mcpStatus}
        </div>
      </header>
      
      <div className="main-content">
        <div className="view-controls">
          <button 
            className={viewMode === '3d' ? 'active' : ''} 
            onClick={() => setViewMode('3d')}
          >
            3D View
          </button>
          <button 
            className={viewMode === 'image' ? 'active' : ''} 
            onClick={() => setViewMode('image')}
            disabled={!robotImage}
          >
            Rendered Image
          </button>
          <button 
            className={viewMode === 'console' ? 'active' : ''} 
            onClick={() => setViewMode('console')}
          >
            MCP Console
          </button>
        </div>
        
        <div className="view-container">
          {viewMode === '3d' && (
            <Suspense fallback={<div className="loading">Loading 3D viewer...</div>}>
              <Canvas className="canvas">
                <PerspectiveCamera makeDefault position={[5, 2, 5]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <RobotViewer created={robotCreated} />
                <OrbitControls />
                <Environment preset="city" />
              </Canvas>
            </Suspense>
          )}
          
          {viewMode === 'image' && (
            <div className="image-view">
              {robotImage ? (
                <img src={robotImage} alt="Pulser Robot Render" />
              ) : (
                <div className="no-image">No rendered image available yet</div>
              )}
            </div>
          )}
          
          {viewMode === 'console' && (
            <Suspense fallback={<div className="loading">Loading console...</div>}>
              <MCPConsole messages={messages} />
            </Suspense>
          )}
        </div>
      </div>
      
      <div className="control-panel">
        <Suspense fallback={<div className="loading">Loading controls...</div>}>
          <ControlPanel 
            mcpStatus={mcpStatus} 
            createRobot={createRobot} 
            changeRobotColor={changeRobotColor}
            robotCreated={robotCreated}
          />
        </Suspense>
      </div>
      
      <footer className="app-footer">
        <p>Pulser MCP Robot Demo - Powered by Model Context Protocol</p>
      </footer>
    </div>
  );
}

export default App;