/**
 * EditorPanel.jsx
 * 
 * A component for editing and improving prompts.
 * Provides functionality for prompt editing, variation creation,
 * and improvement suggestions.
 */

import React, { useState, useEffect } from 'react';
import { improvePrompt, generateVariations } from '../api/promptApi';

const EditorPanel = ({ prompt, onSave, onCreateVariation }) => {
  const [editedContent, setEditedContent] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [improvements, setImprovements] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [variationCount, setVariationCount] = useState(3);
  const [error, setError] = useState(null);
  
  // Available improvement goals
  const availableGoals = [
    { id: 'clarity', label: 'Improve Clarity' },
    { id: 'specificity', label: 'Add Specificity' },
    { id: 'examples', label: 'Add Examples' },
    { id: 'conciseness', label: 'Make More Concise' },
    { id: 'structure', label: 'Improve Structure' }
  ];
  
  useEffect(() => {
    if (prompt) {
      setEditedContent(prompt.content);
    }
  }, [prompt]);
  
  const handleContentChange = (e) => {
    setEditedContent(e.target.value);
  };
  
  const handleGoalToggle = (goalId) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };
  
  const handleImprove = async () => {
    if (!editedContent || selectedGoals.length === 0) {
      setError('Please enter prompt content and select at least one improvement goal');
      return;
    }
    
    setIsImproving(true);
    setError(null);
    
    try {
      const result = await improvePrompt(editedContent, selectedGoals);
      setImprovements(result);
      setEditedContent(result.improvedPrompt);
    } catch (err) {
      setError(err.message || 'Failed to improve prompt');
    } finally {
      setIsImproving(false);
    }
  };
  
  const handleGenerateVariations = async () => {
    if (!editedContent) {
      setError('Please enter prompt content');
      return;
    }
    
    setIsGeneratingVariations(true);
    setError(null);
    
    try {
      const result = await generateVariations(editedContent, variationCount);
      setVariations(result.variations);
    } catch (err) {
      setError(err.message || 'Failed to generate variations');
    } finally {
      setIsGeneratingVariations(false);
    }
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave({
        ...prompt,
        content: editedContent
      });
    }
  };
  
  const handleSelectVariation = (variation) => {
    setEditedContent(variation.prompt);
  };
  
  const handleCreateVariation = () => {
    if (onCreateVariation) {
      onCreateVariation({
        originalPromptId: prompt?.id,
        content: editedContent
      });
    }
  };
  
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>Prompt Editor</h3>
        <div className="editor-actions">
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={!editedContent || editedContent === prompt?.content}
          >
            Save Changes
          </button>
          <button 
            className="create-variation-button" 
            onClick={handleCreateVariation}
          >
            Save as New Variation
          </button>
        </div>
      </div>
      
      {error && (
        <div className="editor-error">
          {error}
        </div>
      )}
      
      <div className="editor-textarea-container">
        <textarea
          className="editor-textarea"
          value={editedContent}
          onChange={handleContentChange}
          placeholder="Enter or edit prompt here..."
          rows={10}
        />
      </div>
      
      <div className="editor-tools">
        <div className="improvement-tools">
          <h4>Improve Prompt</h4>
          
          <div className="improvement-goals">
            {availableGoals.map(goal => (
              <label key={goal.id} className="goal-checkbox">
                <input
                  type="checkbox"
                  checked={selectedGoals.includes(goal.id)}
                  onChange={() => handleGoalToggle(goal.id)}
                />
                {goal.label}
              </label>
            ))}
          </div>
          
          <button
            className="improve-button"
            onClick={handleImprove}
            disabled={isImproving || selectedGoals.length === 0}
          >
            {isImproving ? 'Improving...' : 'Improve Prompt'}
          </button>
          
          {improvements && (
            <div className="improvement-results">
              <h5>Improvements Made</h5>
              <ul className="changes-list">
                {improvements.changes.map((change, index) => (
                  <li key={`change-${index}`}>{change}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="variation-tools">
          <h4>Generate Variations</h4>
          
          <div className="variation-controls">
            <label className="variation-count-label">
              Number of variations:
              <input
                type="number"
                value={variationCount}
                onChange={(e) => setVariationCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                min="1"
                max="5"
              />
            </label>
            
            <button
              className="generate-variations-button"
              onClick={handleGenerateVariations}
              disabled={isGeneratingVariations || !editedContent}
            >
              {isGeneratingVariations ? 'Generating...' : 'Generate Variations'}
            </button>
          </div>
          
          {variations.length > 0 && (
            <div className="variations-list">
              <h5>Variations</h5>
              {variations.map((variation, index) => (
                <div key={`variation-${index}`} className="variation-item">
                  <div className="variation-header">
                    <strong>{variation.name}</strong>
                    <span className="variation-focus">Focus: {variation.focus}</span>
                    <button
                      className="select-variation-button"
                      onClick={() => handleSelectVariation(variation)}
                    >
                      Use This
                    </button>
                  </div>
                  <div className="variation-preview">
                    {variation.prompt.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;