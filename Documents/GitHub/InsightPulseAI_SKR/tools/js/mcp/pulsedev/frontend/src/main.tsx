import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Provider imports
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { EditorProvider } from './contexts/EditorContext';
import { TerminalProvider } from './contexts/TerminalContext';
import { AIAssistantProvider } from './contexts/AIContext';
import { CollaborationProvider } from './contexts/CollaborationContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorkspaceProvider>
        <EditorProvider>
          <TerminalProvider>
            <AIAssistantProvider>
              <CollaborationProvider>
                <App />
              </CollaborationProvider>
            </AIAssistantProvider>
          </TerminalProvider>
        </EditorProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  </React.StrictMode>
);