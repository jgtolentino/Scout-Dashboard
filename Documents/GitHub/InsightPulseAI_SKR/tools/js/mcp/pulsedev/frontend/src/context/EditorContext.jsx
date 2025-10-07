import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { WorkspaceContext } from './WorkspaceContext';

// Create context
export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const { workspace } = useContext(WorkspaceContext);
  const [files, setFiles] = useState({});
  const [fileTree, setFileTree] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  // Load files for the current workspace
  const loadFiles = async () => {
    if (!workspace?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/workspaces/${workspace.id}/files`);
      
      // Create a file map for easy access
      const fileMap = {};
      response.data.forEach(file => {
        fileMap[file.path] = {
          path: file.path,
          name: file.name,
          type: file.type,
          size: file.size,
          modified: file.modified,
          content: file.content || ''
        };
      });
      
      setFiles(fileMap);
      
      // Build file tree structure
      const tree = buildFileTree(response.data);
      setFileTree(tree);
      
      return fileMap;
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error.message || 'Failed to load files');
      return {};
    } finally {
      setIsLoading(false);
    }
  };
  
  // Build a tree structure from flat file list
  const buildFileTree = (fileList) => {
    const root = { name: workspace?.name || 'Project', children: [], type: 'directory' };
    
    // Organize files into tree structure
    fileList.forEach(file => {
      const path = file.path.split('/');
      let currentLevel = root.children;
      
      // Navigate or create directory structure
      for (let i = 0; i < path.length - 1; i++) {
        const dir = path[i];
        let found = currentLevel.find(item => item.name === dir && item.type === 'directory');
        
        if (!found) {
          found = { name: dir, children: [], type: 'directory' };
          currentLevel.push(found);
        }
        
        currentLevel = found.children;
      }
      
      // Add the file to the current level
      currentLevel.push({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size
      });
    });
    
    return root.children;
  };
  
  // Get file content
  const getFileContent = async (filePath) => {
    if (!workspace?.id) return null;
    
    // Check if we already have the content
    if (files[filePath] && files[filePath].content) {
      return files[filePath].content;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/workspaces/${workspace.id}/files/${filePath}`);
      
      // Update file in state
      setFiles(prev => ({
        ...prev,
        [filePath]: {
          ...prev[filePath],
          content: response.data.content
        }
      }));
      
      return response.data.content;
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
      setError(error.message || 'Failed to load file content');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new file
  const createFile = async (filePath, content = '') => {
    if (!workspace?.id) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      await axios.post(
        `${API_URL}/workspaces/${workspace.id}/files/${filePath}`,
        formData
      );
      
      // Update local state
      setFiles(prev => ({
        ...prev,
        [filePath]: {
          path: filePath,
          name: filePath.split('/').pop(),
          type: 'file',
          content,
          modified: new Date().toISOString()
        }
      }));
      
      // Reload files to update tree
      await loadFiles();
      
      // Open the new file
      openFile(filePath);
      
      return true;
    } catch (error) {
      console.error(`Error creating file ${filePath}:`, error);
      setError(error.message || 'Failed to create file');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update file content
  const updateFile = async (filePath, content) => {
    if (!workspace?.id) return false;
    
    // Update local state immediately for responsiveness
    setFiles(prev => ({
      ...prev,
      [filePath]: {
        ...prev[filePath],
        content,
        modified: new Date().toISOString()
      }
    }));
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      await axios.put(
        `${API_URL}/workspaces/${workspace.id}/files/${filePath}`,
        formData
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating file ${filePath}:`, error);
      setError(error.message || 'Failed to update file');
      return false;
    }
  };
  
  // Delete a file
  const deleteFile = async (filePath) => {
    if (!workspace?.id) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/workspaces/${workspace.id}/files/${filePath}`);
      
      // Update local state
      const newFiles = { ...files };
      delete newFiles[filePath];
      setFiles(newFiles);
      
      // Close the file if it's open
      if (openFiles.includes(filePath)) {
        closeFile(filePath);
      }
      
      // Reload files to update tree
      await loadFiles();
      
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      setError(error.message || 'Failed to delete file');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open a file in editor
  const openFile = async (filePath) => {
    // If the file is already open, just set it as active
    if (openFiles.includes(filePath)) {
      setActiveFile(filePath);
      return;
    }
    
    // Get file content if we don't have it yet
    if (!files[filePath]?.content) {
      await getFileContent(filePath);
    }
    
    // Add file to open files
    setOpenFiles(prev => [...prev, filePath]);
    setActiveFile(filePath);
  };
  
  // Close a file
  const closeFile = (filePath) => {
    setOpenFiles(prev => prev.filter(f => f !== filePath));
    
    // If we're closing the active file, set a new active file
    if (activeFile === filePath) {
      const index = openFiles.indexOf(filePath);
      if (index > 0) {
        // Set previous file as active
        setActiveFile(openFiles[index - 1]);
      } else if (openFiles.length > 1) {
        // Set next file as active
        setActiveFile(openFiles[index + 1]);
      } else {
        // No more files open
        setActiveFile(null);
      }
    }
  };
  
  // Reload files when workspace changes
  useEffect(() => {
    loadFiles();
    setOpenFiles([]);
    setActiveFile(null);
  }, [workspace?.id]);
  
  return (
    <EditorContext.Provider
      value={{
        files,
        fileTree,
        activeFile,
        openFiles,
        isLoading,
        error,
        loadFiles,
        getFileContent,
        createFile,
        updateFile,
        deleteFile,
        openFile,
        closeFile,
        setActiveFile
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};