import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import './styles/App.css';

/**
 * Main App component that handles routing
 * Uses React Router to manage navigation between different routes
 */
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Main build routes that use the AppShell with different modes */}
        <Route path="/build/deck/*" element={<AppShell />} />
        <Route path="/build/webapp/*" element={<AppShell />} />
        <Route path="/build/ide/*" element={<AppShell />} />
        <Route path="/build/mobile/*" element={<AppShell />} />
        
        {/* Redirect /build to default mode (mobile) */}
        <Route path="/build" element={<Navigate to="/build/mobile" replace />} />
        
        {/* Redirect root to /build */}
        <Route path="/" element={<Navigate to="/build" replace />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/build" replace />} />
      </Routes>
    </Router>
  );
};

export default App;