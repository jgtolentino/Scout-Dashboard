import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase/config';
import UIBuilder from '../components/UIBuilder';
import EditorHeader from '../components/EditorHeader';
import VersionHistory from '../components/VersionHistory';
import CollaboratorsPanel from '../components/CollaboratorsPanel';
import SavingIndicator from '../components/SavingIndicator';
import { useNotification } from '../hooks/useNotification';
import { useAgentCommunication } from '../hooks/useAgentCommunication';
import { debounce } from '../utils/helpers';
import '../styles/Editor.css';

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const auth = getAuth();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [user, setUser] = useState(null);
  
  const { generateFromPrompt, isGenerating } = useAgentCommunication();
  
  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user) return;
      
      try {
        setIsLoading(true);
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = {
            id: projectDoc.id,
            ...projectDoc.data()
          };
          
          // Check if user has access to this project
          if (projectData.userId !== user.uid && 
              (!projectData.collaborators || !projectData.collaborators.includes(user.uid))) {
            showNotification('You do not have access to this project', 'error');
            navigate('/dashboard');
            return;
          }
          
          setProject(projectData);
        } else {
          showNotification('Project not found', 'error');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        showNotification('Failed to load project', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, user, navigate, showNotification]);
  
  // Autosave functionality
  const saveProject = debounce(async (projectData) => {
    if (!projectId || !user) return;
    
    try {
      setIsSaving(true);
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...projectData,
        lastUpdated: new Date().toISOString(),
      });
      
      // Create a version snapshot
      const versionData = {
        timestamp: new Date().toISOString(),
        userId: user.uid,
        components: projectData.components,
        name: `Auto-save at ${new Date().toLocaleTimeString()}`,
      };
      
      // Logic to store version history would go here
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving project:', error);
      showNotification('Failed to save project', 'error');
      setIsSaving(false);
    }
  }, 2000);
  
  const handleProjectUpdate = (updatedData) => {
    const updatedProject = {
      ...project,
      ...updatedData,
    };
    
    setProject(updatedProject);
    saveProject(updatedProject);
  };
  
  const handleGenerateUI = async (prompt) => {
    if (!prompt || !prompt.trim()) return;
    
    try {
      const result = await generateFromPrompt(prompt);
      
      if (result && result.components) {
        handleProjectUpdate({
          components: result.components,
          lastPrompt: prompt,
        });
        
        showNotification('UI generated successfully', 'success');
      }
    } catch (error) {
      console.error('Error generating UI:', error);
      showNotification('Failed to generate UI', 'error');
    }
  };
  
  const toggleVersionHistory = () => {
    setShowVersionHistory(prev => !prev);
    if (showCollaborators) setShowCollaborators(false);
  };
  
  const toggleCollaborators = () => {
    setShowCollaborators(prev => !prev);
    if (showVersionHistory) setShowVersionHistory(false);
  };
  
  const restoreVersion = (versionData) => {
    handleProjectUpdate({
      components: versionData.components,
    });
    
    showNotification(`Restored to version: ${versionData.name}`, 'success');
    setShowVersionHistory(false);
  };
  
  const addCollaborator = (email) => {
    // Logic to add a collaborator would go here
    showNotification(`Invitation sent to ${email}`, 'success');
  };
  
  if (isLoading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="editor-error">
        <h2>Project not found</h2>
        <p>The project you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="editor-container">
      <EditorHeader
        project={project}
        onGenerateUI={handleGenerateUI}
        onSave={() => saveProject(project)}
        onVersionHistoryToggle={toggleVersionHistory}
        onCollaboratorsToggle={toggleCollaborators}
        isGenerating={isGenerating}
      />
      
      <div className="editor-main">
        <UIBuilder
          projectId={projectId}
          initialComponents={project.components || []}
          onUpdate={(components) => handleProjectUpdate({ components })}
          initialPrompt={project.initialPrompt}
        />
        
        {showVersionHistory && (
          <VersionHistory
            projectId={projectId}
            onClose={() => setShowVersionHistory(false)}
            onRestore={restoreVersion}
          />
        )}
        
        {showCollaborators && (
          <CollaboratorsPanel
            projectId={projectId}
            collaborators={project.collaborators || []}
            onAddCollaborator={addCollaborator}
            onClose={() => setShowCollaborators(false)}
          />
        )}
      </div>
      
      <SavingIndicator isSaving={isSaving} />
    </div>
  );
};

export default Editor;