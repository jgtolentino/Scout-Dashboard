import { useState, useEffect, useCallback } from 'react';
import { getDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateUniqueId } from '../utils/helpers';

/**
 * Hook for managing the UI state in the editor
 * Handles components, selection, and saving
 */
const useUIState = (projectId) => {
  const [uiState, setUIState] = useState({
    components: [],
    metadata: {
      name: '',
      description: '',
      tags: [],
      lastUpdated: new Date().toISOString(),
    }
  });
  
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Load initial state from Firebase
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setUIState({
            components: projectData.components || [],
            metadata: {
              name: projectData.name || '',
              description: projectData.description || '',
              tags: projectData.tags || [],
              lastUpdated: projectData.lastUpdated || new Date().toISOString(),
            }
          });
        }
        setLoaded(true);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err.message);
        setLoaded(true);
      }
    };
    
    loadProject();
  }, [projectId]);
  
  // Add a new component to the canvas
  const addComponent = useCallback((component) => {
    setUIState(prevState => ({
      ...prevState,
      components: [...prevState.components, { 
        ...component,
        id: component.id || generateUniqueId()
      }],
      metadata: {
        ...prevState.metadata,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);
  
  // Update an existing component
  const updateComponent = useCallback((componentId, updates) => {
    setUIState(prevState => {
      const updatedComponents = prevState.components.map(component => {
        if (component.id === componentId) {
          return { ...component, ...updates };
        }
        return component;
      });
      
      return {
        ...prevState,
        components: updatedComponents,
        metadata: {
          ...prevState.metadata,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Remove a component
  const removeComponent = useCallback((componentId) => {
    setUIState(prevState => ({
      ...prevState,
      components: prevState.components.filter(component => component.id !== componentId),
      metadata: {
        ...prevState.metadata,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);
  
  // Update component position or size in the layout
  const moveComponent = useCallback((componentId, layout) => {
    setUIState(prevState => {
      const updatedComponents = prevState.components.map(component => {
        if (component.id === componentId) {
          return { 
            ...component, 
            layout: { ...component.layout, ...layout } 
          };
        }
        return component;
      });
      
      return {
        ...prevState,
        components: updatedComponents,
        metadata: {
          ...prevState.metadata,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Clear all components from the canvas
  const clearCanvas = useCallback(() => {
    setUIState(prevState => ({
      ...prevState,
      components: [],
      metadata: {
        ...prevState.metadata,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);
  
  // Update metadata
  const updateMetadata = useCallback((metadata) => {
    setUIState(prevState => ({
      ...prevState,
      metadata: {
        ...prevState.metadata,
        ...metadata,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);
  
  // Save state to Firebase
  const saveState = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        components: uiState.components,
        name: uiState.metadata.name,
        description: uiState.metadata.description,
        tags: uiState.metadata.tags,
        lastUpdated: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err.message);
      return false;
    }
  }, [projectId, uiState]);
  
  // Load state from external source
  const loadState = useCallback((newState) => {
    setUIState(prevState => ({
      ...prevState,
      ...newState,
      metadata: {
        ...prevState.metadata,
        ...(newState.metadata || {}),
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);
  
  return {
    uiState,
    loaded,
    error,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    clearCanvas,
    updateMetadata,
    saveState,
    loadState
  };
};

export default useUIState;