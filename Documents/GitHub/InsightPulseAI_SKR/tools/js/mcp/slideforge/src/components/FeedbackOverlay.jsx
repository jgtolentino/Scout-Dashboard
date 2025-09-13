import React, { useState } from 'react';

/**
 * FeedbackOverlay component for displaying AI feedback on slides
 * 
 * @param {Object} props
 * @param {Object} props.feedback - Feedback data
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onApplySuggestion - Callback to apply suggested revisions
 */
const FeedbackOverlay = ({ feedback, onClose, onApplySuggestion }) => {
  const [activeTab, setActiveTab] = useState('overall');
  const [expandedSlides, setExpandedSlides] = useState([]);
  
  if (!feedback) return null;
  
  const { overall_feedback, slide_feedback } = feedback;
  
  // Toggle a slide's expanded state
  const toggleSlideExpanded = (index) => {
    if (expandedSlides.includes(index)) {
      setExpandedSlides(expandedSlides.filter(i => i !== index));
    } else {
      setExpandedSlides([...expandedSlides, index]);
    }
  };
  
  // Check if a slide has suggested revisions
  const hasSuggestions = (slide) => {
    return slide.suggested_revisions && 
           (slide.suggested_revisions.title || slide.suggested_revisions.body);
  };
  
  return (
    <div className="feedback-overlay">
      <div className="feedback-container">
        <div className="feedback-header">
          <h2>AI Feedback</h2>
          <div className="feedback-tabs">
            <button 
              className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
              onClick={() => setActiveTab('overall')}
            >
              Overall Feedback
            </button>
            <button 
              className={`tab ${activeTab === 'slides' ? 'active' : ''}`}
              onClick={() => setActiveTab('slides')}
            >
              Slide-by-Slide Feedback
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="feedback-content">
          {activeTab === 'overall' && overall_feedback && (
            <div className="overall-feedback">
              <div className="feedback-section">
                <h3>Strengths</h3>
                <ul>
                  {overall_feedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="feedback-section">
                <h3>Areas for Improvement</h3>
                <ul>
                  {overall_feedback.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
              
              <div className="feedback-section">
                <h3>Recommendations</h3>
                <ul>
                  {overall_feedback.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'slides' && slide_feedback && (
            <div className="slide-feedback-list">
              {slide_feedback.map((slideFeedback) => {
                const isExpanded = expandedSlides.includes(slideFeedback.slide_index);
                
                return (
                  <div 
                    key={slideFeedback.slide_index}
                    className={`slide-feedback-item ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div 
                      className="slide-feedback-header"
                      onClick={() => toggleSlideExpanded(slideFeedback.slide_index)}
                    >
                      <h3>Slide {slideFeedback.slide_index + 1}: {slideFeedback.title}</h3>
                      <span className="expand-indicator">{isExpanded ? '−' : '+'}</span>
                    </div>
                    
                    {isExpanded && (
                      <div className="slide-feedback-details">
                        <p className="feedback-text">{slideFeedback.feedback}</p>
                        
                        {hasSuggestions(slideFeedback) && (
                          <div className="suggested-revisions">
                            <h4>Suggested Revisions</h4>
                            
                            {slideFeedback.suggested_revisions.title && (
                              <div className="suggestion">
                                <h5>Title</h5>
                                <p>{slideFeedback.suggested_revisions.title}</p>
                              </div>
                            )}
                            
                            {slideFeedback.suggested_revisions.body && (
                              <div className="suggestion">
                                <h5>Content</h5>
                                <p className="suggested-body">
                                  {slideFeedback.suggested_revisions.body.split('\n').map((line, i) => (
                                    <span key={i}>{line}<br /></span>
                                  ))}
                                </p>
                              </div>
                            )}
                            
                            <button 
                              className="apply-suggestion-btn"
                              onClick={() => onApplySuggestion(
                                slideFeedback.slide_index, 
                                slideFeedback.suggested_revisions
                              )}
                            >
                              Apply Suggestions
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackOverlay;