import React, { useState } from 'react';
import '../../styles/IntentAnalyzer.css';

/**
 * IntentAnalyzer - Modal component for analyzing user input to determine intent
 * Uses natural language to detect whether the user wants to create a deck, webapp, or mobile app
 */
const IntentAnalyzer = ({ onAnalyze, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  // Examples to show in the UI
  const examples = [
    {
      text: 'Build a photo sharing app with likes and comments',
      mode: 'mobile'
    },
    {
      text: 'Create a presentation about artificial intelligence',
      mode: 'deck'
    },
    {
      text: 'Make a landing page for my startup',
      mode: 'webapp'
    }
  ];
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a description of what you want to build.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // In a real implementation, this would make an API call to analyze the intent
      // For this demo, we'll just pass the prompt to the parent component
      await onAnalyze(prompt);
      onClose();
    } catch (error) {
      console.error('Error analyzing intent:', error);
      setError('An error occurred while analyzing your prompt. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle using an example
  const handleUseExample = (exampleText) => {
    setPrompt(exampleText);
  };
  
  return (
    <div className="intent-analyzer-overlay">
      <div className="intent-analyzer-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>What would you like to build?</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="prompt-input-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build in natural language..."
              rows={5}
              disabled={isAnalyzing}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="examples-container">
            <h3>Examples:</h3>
            <div className="examples-grid">
              {examples.map((example, index) => (
                <div 
                  key={index} 
                  className={`example-card ${example.mode}`}
                  onClick={() => handleUseExample(example.text)}
                >
                  <p>{example.text}</p>
                  <span className="example-mode">
                    {example.mode === 'mobile' ? '📱 Mobile App' : 
                     example.mode === 'deck' ? '🖼️ Presentation' : 
                     '🌐 Website'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="intent-analyzer-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isAnalyzing}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-button"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Create Project'}
            </button>
          </div>
        </form>
        
        <div className="intent-analyzer-footer">
          <p>Built with Claude Max for intelligent intent detection</p>
        </div>
      </div>
    </div>
  );
};

export default IntentAnalyzer;