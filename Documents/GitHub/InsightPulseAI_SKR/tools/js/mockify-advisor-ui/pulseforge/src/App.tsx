import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Dashboard from './components/Dashboard';
import AppBuilder from './components/AppBuilder';
import SchemaDesigner from './components/SchemaDesigner';
import Marketplace from './components/Marketplace';
import Deployments from './components/Deployments';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/toaster';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex h-screen bg-background text-foreground">
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/build" element={<AppBuilder />} />
            <Route path="/schema" element={<SchemaDesigner />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;