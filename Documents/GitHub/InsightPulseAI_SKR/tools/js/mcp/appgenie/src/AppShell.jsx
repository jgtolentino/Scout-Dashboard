import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DeckBuilder from './routes/DeckBuilder';
import WebAppIDE from './routes/WebAppIDE';
import AppGenieBuilder from './routes/AppGenieBuilder';
import IntentAnalyzer from './components/shared/IntentAnalyzer';
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import StatusBar from './components/shared/StatusBar';
import './styles/AppShell.css';

/**
 * AppShell - Main application container that handles routing between different UI modes
 * Provides shared layout, state, and navigation while keeping individual mode logic separate
 */
const AppShell = () => {
  // Get current location and navigation functions from router
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine current mode based on URL path
  const [currentMode, setCurrentMode] = useState('mobile');
  const [showIntentAnalyzer, setShowIntentAnalyzer] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Extract mode from URL path on component mount or path change
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/deck')) {
      setCurrentMode('deck');
    } else if (path.includes('/webapp') || path.includes('/ide')) {
      setCurrentMode('webapp');
    } else if (path.includes('/mobile')) {
      setCurrentMode('mobile');
    }
  }, [location.pathname]);
  
  // Handle mode switching
  const switchMode = (mode) => {
    if (mode === currentMode) return;
    
    // Ask for confirmation if project is active
    if (projectName && !window.confirm(`Switch to ${mode} mode? Any unsaved changes will be lost.`)) {
      return;
    }
    
    navigate(`/build/${mode}`);
    setCurrentMode(mode);
  };
  
  // Handle intent analysis to automatically determine the appropriate mode
  const handleIntentAnalysis = async (prompt) => {
    setIsLoading(true);
    setStatusMessage('Analyzing prompt...');
    
    try {
      // In a real implementation, this would call the NLP parser agent
      // For now, we'll use a simple heuristic
      let detectedMode = 'mobile'; // Default mode
      
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes('presentation') || 
          lowerPrompt.includes('slide') || 
          lowerPrompt.includes('deck')) {
        detectedMode = 'deck';
      } else if (lowerPrompt.includes('website') || 
                lowerPrompt.includes('landing page') || 
                lowerPrompt.includes('webapp')) {
        detectedMode = 'webapp';
      } else if (lowerPrompt.includes('app') || 
                lowerPrompt.includes('mobile') || 
                lowerPrompt.includes('ios') || 
                lowerPrompt.includes('android')) {
        detectedMode = 'mobile';
      }
      
      // Extract a project name from the prompt
      const projectNameMatch = prompt.match(/(?:build|create|make)(?: an?| a)? ([\w\s]+?)(?= app| website| presentation| that| with| for|$)/i);
      const extractedName = projectNameMatch ? 
        projectNameMatch[1].trim().replace(/\b\w/g, l => l.toUpperCase()) : 
        `New${detectedMode === 'deck' ? 'Presentation' : detectedMode === 'webapp' ? 'Website' : 'App'}`;
      
      setProjectName(extractedName);
      
      // Switch to the detected mode
      if (detectedMode !== currentMode) {
        navigate(`/build/${detectedMode}`);
        setCurrentMode(detectedMode);
      }
      
      // Pass the prompt to the appropriate builder component
      // This would be handled via state or context in a real implementation
      setStatusMessage(`Creating "${extractedName}" in ${detectedMode} mode...`);
      
      // Simulate processing time
      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage(`"${extractedName}" ready for editing`);
      }, 2000);
      
    } catch (error) {
      console.error('Error analyzing intent:', error);
      setStatusMessage('Error analyzing prompt. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle new project creation
  const handleNewProject = () => {
    setShowIntentAnalyzer(true);
  };
  
  // Close the intent analyzer
  const closeIntentAnalyzer = () => {
    setShowIntentAnalyzer(false);
  };
  
  return (
    <div className={`app-shell ${currentMode}-mode`}>
      {/* Top navbar with mode switcher */}
      <Navbar 
        currentMode={currentMode} 
        onSwitchMode={switchMode}
        onNewProject={handleNewProject}
        projectName={projectName}
      />
      
      <div className="app-shell-content">
        {/* Left sidebar with tools and navigation */}
        <Sidebar mode={currentMode} />
        
        {/* Main content area - renders the appropriate builder based on mode */}
        <main className="app-shell-main">
          {currentMode === 'deck' && (
            <DeckBuilder 
              projectName={projectName} 
              isLoading={isLoading}
            />
          )}
          
          {currentMode === 'webapp' && (
            <WebAppIDE 
              projectName={projectName}
              isLoading={isLoading}
            />
          )}
          
          {currentMode === 'mobile' && (
            <AppGenieBuilder 
              projectName={projectName}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>
      
      {/* Bottom status bar */}
      <StatusBar 
        mode={currentMode} 
        status={statusMessage}
        isLoading={isLoading}
      />
      
      {/* Intent analyzer modal */}
      {showIntentAnalyzer && (
        <IntentAnalyzer 
          onAnalyze={handleIntentAnalysis}
          onClose={closeIntentAnalyzer}
        />
      )}
    </div>
  );
};

export default AppShell;