import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// Create context
export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const navigate = useNavigate();
  const params = useParams();
  
  // Load all workspaces
  const loadWorkspaces = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/workspaces`);
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setError(error.message || 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a specific workspace
  const loadWorkspace = async (workspaceId) => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/workspaces/${workspaceId}`);
      setWorkspace(response.data);
    } catch (error) {
      console.error(`Error loading workspace ${workspaceId}:`, error);
      setError(error.message || 'Failed to load workspace');
      // If the workspace doesn't exist, redirect to home
      if (error.response && error.response.status === 404) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new workspace
  const createWorkspace = async (name, template) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/workspaces`, {
        name,
        template
      });
      
      const newWorkspace = response.data;
      setWorkspaces([...workspaces, newWorkspace]);
      
      // Navigate to the new workspace
      navigate(`/workspace/${newWorkspace.workspace_id || newWorkspace.id}`);
      
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError(error.message || 'Failed to create workspace');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a workspace
  const deleteWorkspace = async (workspaceId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/workspaces/${workspaceId}`);
      
      // Update local state
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
      
      if (workspace && workspace.id === workspaceId) {
        setWorkspace(null);
        navigate('/');
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting workspace ${workspaceId}:`, error);
      setError(error.message || 'Failed to delete workspace');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load initial data
  useEffect(() => {
    loadWorkspaces();
  }, []);
  
  // Load workspace from URL parameter
  useEffect(() => {
    if (params.workspaceId) {
      loadWorkspace(params.workspaceId);
    }
  }, [params.workspaceId]);
  
  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        workspace,
        isLoading,
        error,
        loadWorkspaces,
        loadWorkspace,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};