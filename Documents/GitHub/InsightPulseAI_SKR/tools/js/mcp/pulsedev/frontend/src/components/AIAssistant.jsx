import React, { useState, useContext, useEffect, useRef } from 'react';
import { AIContext } from '../context/AIContext';
import { EditorContext } from '../context/EditorContext';
import './AIAssistant.css';

const AIAssistant = ({ onClose }) => {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages,
    availableModels,
    selectedModel,
    setSelectedModel,
    isSocketConnected
  } = useContext(AIContext);
  
  const { activeFile } = useContext(EditorContext);
  
  const [userInput, setUserInput] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input on open
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    sendMessage(userInput);
    setUserInput('');
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };
  
  const handleClear = () => {
    clearMessages();
  };
  
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    setShowModelSelector(false);
  };
  
  // Format code blocks in messages
  const formatMessage = (content) => {
    if (!content) return '';
    
    // Split by code blocks
    const parts = content.split(/(```[^`]*```)/g);
    
    return parts.map((part, i) => {
      // Check if this is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3);
        const language = code.split('\n')[0].trim();
        const codeContent = language 
          ? code.substring(language.length).trim() 
          : code.trim();
        
        return (
          <div key={i} className="code-block">
            {language && <div className="code-language">{language}</div>}
            <pre>
              <code>{codeContent}</code>
            </pre>
            <button 
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(codeContent)}
              title="Copy to clipboard"
            >
              <i className="icon-copy"></i>
            </button>
          </div>
        );
      }
      
      // Regular text
      return <p key={i} className="message-text">{part}</p>;
    });
  };
  
  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-header-title">
          <div className="ai-logo">🤖</div>
          <h2>AI Assistant</h2>
          {isSocketConnected ? (
            <span className="connection-status connected">Connected</span>
          ) : (
            <span className="connection-status disconnected">Disconnected</span>
          )}
        </div>
        
        <div className="ai-header-actions">
          <div className="model-selector-container">
            <button 
              className="model-selector-button"
              onClick={() => setShowModelSelector(!showModelSelector)}
            >
              {selectedModel}
              <i className="icon-chevron-down"></i>
            </button>
            
            {showModelSelector && (
              <div className="model-dropdown">
                {availableModels.map(model => (
                  <div 
                    key={model.id}
                    className={`model-option ${selectedModel === model.id ? 'active' : ''}`}
                    onClick={() => handleModelChange(model.id)}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="action-button"
            onClick={handleClear}
            title="Clear conversation"
          >
            <i className="icon-trash"></i>
          </button>
          
          <button 
            className="action-button close-button"
            onClick={onClose}
            title="Close"
          >
            <i className="icon-close"></i>
          </button>
        </div>
      </div>
      
      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>How can I help you with your code?</h3>
            <div className="suggestions">
              <div className="suggestion" onClick={() => setUserInput("Explain this code to me")}>
                Explain this code
              </div>
              <div className="suggestion" onClick={() => setUserInput("Help me debug this error")}>
                Debug an error
              </div>
              <div className="suggestion" onClick={() => setUserInput("Generate a React component for a login form")}>
                Generate code
              </div>
              <div className="suggestion" onClick={() => setUserInput("What does the `useEffect` hook do in React?")}>
                Ask a question
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.streaming ? 'streaming' : ''}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  {formatMessage(message.content)}
                </div>
              </div>
            ))}
            
            {isLoading && !messages.some(m => m.streaming) && (
              <div className="message assistant-message loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-content">{error}</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="ai-input-container">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="ai-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeFile 
                ? `Ask about ${activeFile.split('/').pop()}...` 
                : "Ask me anything about your code..."}
              rows={1}
              disabled={isLoading && !messages.some(m => m.streaming)}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={isLoading && !messages.some(m => m.streaming) || !userInput.trim()}
            >
              <i className="icon-send"></i>
            </button>
          </div>
          <div className="input-hint">
            <span className="hint-text">Press <kbd>Enter</kbd> to send. Use <kbd>Shift+Enter</kbd> for new line.</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;