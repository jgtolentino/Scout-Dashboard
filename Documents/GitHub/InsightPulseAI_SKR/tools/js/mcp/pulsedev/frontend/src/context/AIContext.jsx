import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { WorkspaceContext } from './WorkspaceContext';
import { EditorContext } from './EditorContext';

// Create context
export const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const { workspace } = useContext(WorkspaceContext);
  const { activeFile, files } = useContext(EditorContext);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('claude');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
  
  const socketRef = useRef(null);
  const messageIdCounter = useRef(0);
  
  // Connect to websocket for real-time responses
  useEffect(() => {
    if (!workspace?.id) return;
    
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Connect to websocket
    const socket = new WebSocket(`${WS_URL}/ai/${workspace.id}`);
    
    socket.onopen = () => {
      console.log('AI assistant WebSocket connected');
      setIsSocketConnected(true);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'response') {
          // Add response to messages
          setMessages(prev => [
            ...prev,
            {
              id: message.id,
              role: 'assistant',
              content: message.content,
              timestamp: new Date().toISOString()
            }
          ]);
          setIsLoading(false);
        } else if (message.type === 'error') {
          console.error('AI assistant error:', message.error);
          setError(message.error);
          setIsLoading(false);
        } else if (message.type === 'stream') {
          // Handle streaming response
          setMessages(prev => {
            const existingIndex = prev.findIndex(msg => msg.id === message.id);
            
            if (existingIndex >= 0) {
              // Update existing message
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: updated[existingIndex].content + message.content
              };
              return updated;
            } else {
              // Create new message
              return [
                ...prev,
                {
                  id: message.id,
                  role: 'assistant',
                  content: message.content,
                  timestamp: new Date().toISOString(),
                  streaming: true
                }
              ];
            }
          });
        } else if (message.type === 'stream_end') {
          // Mark streaming as complete
          setMessages(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(msg => msg.id === message.id);
            
            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                streaming: false
              };
            }
            
            return updated;
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error parsing AI assistant message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('AI assistant WebSocket error:', error);
      setIsSocketConnected(false);
      setError('WebSocket connection error');
    };
    
    socket.onclose = () => {
      console.log('AI assistant WebSocket closed');
      setIsSocketConnected(false);
    };
    
    socketRef.current = socket;
    
    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [workspace?.id]);
  
  // Get available AI models
  const getAvailableModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/models`);
      setAvailableModels(response.data);
      
      // Set default model if available
      if (response.data.length > 0 && !selectedModel) {
        setSelectedModel(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
      setError(error.message || 'Failed to fetch available models');
    }
  };
  
  // Load available models on mount
  useEffect(() => {
    getAvailableModels();
  }, []);
  
  // Send a message to the AI assistant
  const sendMessage = async (content, options = {}) => {
    if (!workspace?.id || !content) return null;
    
    // Prepare message
    const messageId = `msg-${Date.now()}-${messageIdCounter.current++}`;
    const userMessage = {
      id: messageId,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Add to messages immediately for UI responsiveness
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if socket is connected
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Send via WebSocket for streaming support
        socketRef.current.send(JSON.stringify({
          type: 'message',
          id: messageId,
          content,
          model: selectedModel,
          context: {
            workspace_id: workspace.id,
            active_file: activeFile,
            file_content: activeFile ? files[activeFile]?.content : null,
            ...options.context
          },
          stream: options.stream !== false
        }));
        
        return messageId;
      } else {
        // Fallback to REST API if socket is not available
        const response = await axios.post(`${API_URL}/ai/chat`, {
          model: selectedModel,
          messages: [
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content }
          ],
          context: {
            workspace_id: workspace.id,
            active_file: activeFile,
            file_content: activeFile ? files[activeFile]?.content : null,
            ...options.context
          }
        });
        
        // Add response to messages
        setMessages(prev => [
          ...prev,
          {
            id: `resp-${messageId}`,
            role: 'assistant',
            content: response.data.content,
            timestamp: new Date().toISOString()
          }
        ]);
        
        setIsLoading(false);
        return messageId;
      }
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      setError(error.message || 'Failed to send message');
      setIsLoading(false);
      return null;
    }
  };
  
  // Get code suggestions for the current file
  const getCodeSuggestions = async (codeContext, options = {}) => {
    if (!workspace?.id || !activeFile) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/ai/code/suggestions`, {
        model: selectedModel,
        file_path: activeFile,
        code_context: codeContext,
        language: getLanguageFromFile(activeFile),
        ...options
      });
      
      setIsLoading(false);
      return response.data.suggestions;
    } catch (error) {
      console.error('Error getting code suggestions:', error);
      setError(error.message || 'Failed to get code suggestions');
      setIsLoading(false);
      return null;
    }
  };
  
  // Explain code
  const explainCode = async (code, options = {}) => {
    if (!workspace?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/ai/code/explain`, {
        model: selectedModel,
        code,
        language: options.language || (activeFile ? getLanguageFromFile(activeFile) : null),
        detail_level: options.detailLevel || 'medium'
      });
      
      setIsLoading(false);
      return response.data.explanation;
    } catch (error) {
      console.error('Error getting code explanation:', error);
      setError(error.message || 'Failed to explain code');
      setIsLoading(false);
      return null;
    }
  };
  
  // Generate code from description
  const generateCode = async (description, options = {}) => {
    if (!workspace?.id) return null;
    
    // Prepare message
    const messageId = `gen-${Date.now()}-${messageIdCounter.current++}`;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/ai/code/generate`, {
        model: selectedModel,
        description,
        language: options.language || (activeFile ? getLanguageFromFile(activeFile) : 'javascript'),
        comments: options.comments !== false,
        context: {
          workspace_id: workspace.id,
          active_file: activeFile,
          file_content: activeFile ? files[activeFile]?.content : null,
          ...options.context
        }
      });
      
      setIsLoading(false);
      return {
        id: messageId,
        code: response.data.code,
        language: response.data.language
      };
    } catch (error) {
      console.error('Error generating code:', error);
      setError(error.message || 'Failed to generate code');
      setIsLoading(false);
      return null;
    }
  };
  
  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };
  
  // Helper to get language from file extension
  const getLanguageFromFile = (filePath) => {
    if (!filePath) return null;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'jsx';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'tsx';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return extension;
    }
  };
  
  return (
    <AIContext.Provider
      value={{
        messages,
        isLoading,
        error,
        availableModels,
        selectedModel,
        isSocketConnected,
        setSelectedModel,
        sendMessage,
        getCodeSuggestions,
        explainCode,
        generateCode,
        clearMessages
      }}
    >
      {children}
    </AIContext.Provider>
  );
};