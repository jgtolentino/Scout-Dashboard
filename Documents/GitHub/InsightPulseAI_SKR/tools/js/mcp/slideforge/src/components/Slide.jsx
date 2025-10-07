import React, { useState } from 'react';

/**
 * Slide component for rendering and editing individual slides
 * 
 * @param {Object} props
 * @param {Object} props.slide - Slide data (title, body, image_prompt)
 * @param {number} props.index - Slide index in the deck
 * @param {boolean} props.editable - Whether the slide is editable
 * @param {Function} props.onChange - Callback for slide changes
 * @param {Object} props.feedback - Feedback for this slide (optional)
 */
const Slide = ({ 
  slide, 
  index, 
  editable = false, 
  onChange, 
  feedback = null,
  onSelect,
  isSelected
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlide, setEditedSlide] = useState({ ...slide });
  
  const handleEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };
  
  const handleChange = (field, value) => {
    const updated = { ...editedSlide, [field]: value };
    setEditedSlide(updated);
  };
  
  const handleSave = () => {
    onChange(index, editedSlide);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedSlide({ ...slide });
    setIsEditing(false);
  };

  const handleSlideClick = () => {
    if (onSelect && !isEditing) {
      onSelect(index);
    }
  };
  
  return (
    <div 
      className={`slide-container ${isSelected ? 'slide-selected' : ''}`}
      onClick={handleSlideClick}
    >
      {/* Slide number indicator */}
      <div className="slide-number">{index + 1}</div>
      
      {isEditing ? (
        <div className="slide-edit-mode">
          <input
            type="text"
            value={editedSlide.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="slide-title-input"
            placeholder="Slide Title"
          />
          
          <textarea
            value={editedSlide.body}
            onChange={(e) => handleChange('body', e.target.value)}
            className="slide-body-input"
            placeholder="Slide Content"
            rows={6}
          />
          
          <textarea
            value={editedSlide.image_prompt}
            onChange={(e) => handleChange('image_prompt', e.target.value)}
            className="slide-image-prompt-input"
            placeholder="Image Description"
            rows={3}
          />
          
          <div className="slide-edit-actions">
            <button onClick={handleSave} className="slide-save-btn">Save</button>
            <button onClick={handleCancel} className="slide-cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="slide-view-mode" onDoubleClick={handleEdit}>
          <div className="slide-content">
            <h3 className="slide-title">{slide.title}</h3>
            <div className="slide-body">
              {slide.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          
          <div className="slide-image-placeholder">
            <p className="slide-image-prompt">{slide.image_prompt}</p>
          </div>
          
          {editable && (
            <button onClick={handleEdit} className="slide-edit-btn">
              Edit
            </button>
          )}
          
          {feedback && (
            <div className="slide-feedback">
              <h4>Feedback</h4>
              <p>{feedback.feedback}</p>
              {feedback.suggested_revisions && (
                <button className="slide-apply-suggestion-btn">
                  Apply Suggestions
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Slide;