/**
 * PromptViewer.jsx
 * 
 * A component for viewing and interacting with system prompts.
 * Displays prompt content with syntax highlighting and metadata.
 */

import React, { useState, useEffect } from 'react';
import { fetchPrompt, analyzePrompt } from '../api/promptApi';
import ScoreChart from './ScoreChart';
import TagList from './TagList';

const PromptViewer = ({ promptId, promptPath }) => {
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadPrompt() {
      if (!promptPath) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchPrompt(promptPath);
        setPrompt(result);
      } catch (err) {
        setError(err.message || 'Failed to load prompt');
      } finally {
        setLoading(false);
      }
    }
    
    loadPrompt();
  }, [promptPath]);

  const handleAnalyze = async () => {
    if (!prompt || analyzing) return;
    
    setAnalyzing(true);
    
    try {
      const analysisResult = await analyzePrompt(prompt.content);
      setAnalysis(analysisResult);
    } catch (err) {
      setError(err.message || 'Failed to analyze prompt');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="prompt-viewer-loading">Loading prompt...</div>;
  }

  if (error) {
    return <div className="prompt-viewer-error">Error: {error}</div>;
  }

  if (!prompt) {
    return <div className="prompt-viewer-empty">Select a prompt to view</div>;
  }

  return (
    <div className="prompt-viewer">
      <div className="prompt-viewer-header">
        <h2>{prompt.name || 'Unnamed Prompt'}</h2>
        <TagList tags={prompt.tags || []} />
      </div>
      
      <div className="prompt-viewer-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Category:</span>
          <span className="metadata-value">{prompt.category || 'Uncategorized'}</span>
        </div>
        {prompt.author && (
          <div className="metadata-item">
            <span className="metadata-label">Author:</span>
            <span className="metadata-value">{prompt.author}</span>
          </div>
        )}
        {prompt.lastModified && (
          <div className="metadata-item">
            <span className="metadata-label">Last Modified:</span>
            <span className="metadata-value">{new Date(prompt.lastModified).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <div className="prompt-viewer-actions">
        <button 
          className="analyze-button" 
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Prompt'}
        </button>
        <button className="copy-button">
          Copy to Clipboard
        </button>
        <button className="edit-button">
          Edit
        </button>
      </div>
      
      <div className="prompt-content-wrapper">
        <pre className="prompt-content">{prompt.content}</pre>
      </div>
      
      {analysis && (
        <div className="prompt-analysis">
          <h3>Prompt Analysis</h3>
          
          <div className="analysis-metrics">
            <div className="metric">
              <span className="metric-label">Word Count:</span>
              <span className="metric-value">{analysis.wordCount}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Character Count:</span>
              <span className="metric-value">{analysis.characters}</span>
            </div>
          </div>
          
          <ScoreChart scores={analysis.scores} />
          
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="analysis-section">
              <h4>Strengths</h4>
              <ul className="strength-list">
                {analysis.strengths.map((strength, index) => (
                  <li key={`strength-${index}`} className="strength-item">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="analysis-section">
              <h4>Improvement Opportunities</h4>
              <ul className="weakness-list">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={`weakness-${index}`} className="weakness-item">
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
            <div className="analysis-section">
              <h4>Suggestions</h4>
              <ul className="suggestion-list">
                {analysis.improvementSuggestions.map((suggestion, index) => (
                  <li key={`suggestion-${index}`} className="suggestion-item">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptViewer;