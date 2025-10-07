import React, { useState, useEffect } from 'react';
import Slide from './Slide';
import FeedbackOverlay from './FeedbackOverlay';

/**
 * SlideEditor component for editing a complete slide deck
 * 
 * @param {Object} props
 * @param {Array} props.slides - Array of slide objects
 * @param {string} props.deckTitle - Title of the deck
 * @param {boolean} props.editable - Whether the deck is editable
 * @param {Object} props.feedback - Feedback data (optional)
 * @param {Function} props.onSave - Callback for saving changes
 */
const SlideEditor = ({ 
  slides: initialSlides, 
  deckTitle: initialTitle = 'Untitled Deck',
  editable = true,
  feedback = null,
  onSave
}) => {
  const [slides, setSlides] = useState(initialSlides || []);
  const [deckTitle, setDeckTitle] = useState(initialTitle);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState(null);
  
  // Effect to apply initial feedback if provided
  useEffect(() => {
    if (feedback) {
      setShowFeedback(true);
    }
  }, [feedback]);
  
  // Handle slide selection
  const handleSelectSlide = (index) => {
    setSelectedSlideIndex(index);
  };
  
  // Handle slide updates
  const handleSlideChange = (index, updatedSlide) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = updatedSlide;
    setSlides(updatedSlides);
  };
  
  // Add a new slide
  const handleAddSlide = () => {
    const newSlide = {
      title: 'New Slide',
      body: 'Add your content here',
      image_prompt: 'Describe the image for this slide'
    };
    
    setSlides([...slides, newSlide]);
    // Select the new slide
    setSelectedSlideIndex(slides.length);
  };
  
  // Delete a slide
  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      alert('Cannot delete the only slide in the deck');
      return;
    }
    
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
    
    // Update selected slide if needed
    if (selectedSlideIndex === index) {
      setSelectedSlideIndex(Math.min(index, updatedSlides.length - 1));
    } else if (selectedSlideIndex > index) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    }
  };
  
  // Reorder slides via drag and drop
  const handleDragStart = (index) => {
    setIsDragging(true);
    setDraggedSlideIndex(index);
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedSlideIndex === null || draggedSlideIndex === index) return;
    
    const updatedSlides = [...slides];
    const draggedSlide = updatedSlides[draggedSlideIndex];
    
    // Remove the dragged slide
    updatedSlides.splice(draggedSlideIndex, 1);
    // Insert it at the new position
    updatedSlides.splice(index, 0, draggedSlide);
    
    setSlides(updatedSlides);
    setDraggedSlideIndex(index);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedSlideIndex(null);
  };
  
  // Save the entire deck
  const handleSaveDeck = () => {
    if (onSave) {
      onSave({
        title: deckTitle,
        slides: slides
      });
    }
  };
  
  // Get feedback for a specific slide
  const getSlideFeeback = (index) => {
    if (!feedback || !feedback.slide_feedback) return null;
    return feedback.slide_feedback.find(fb => fb.slide_index === index);
  };
  
  // Toggle feedback visibility
  const toggleFeedback = () => {
    setShowFeedback(!showFeedback);
  };
  
  return (
    <div className="slide-editor-container">
      <div className="slide-editor-header">
        {editable ? (
          <input
            type="text"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            className="deck-title-input"
            placeholder="Deck Title"
          />
        ) : (
          <h1 className="deck-title">{deckTitle}</h1>
        )}
        
        <div className="slide-editor-actions">
          {editable && (
            <>
              <button onClick={handleAddSlide} className="add-slide-btn">
                Add Slide
              </button>
              <button onClick={handleSaveDeck} className="save-deck-btn">
                Save Deck
              </button>
            </>
          )}
          
          {feedback && (
            <button 
              onClick={toggleFeedback} 
              className={`toggle-feedback-btn ${showFeedback ? 'active' : ''}`}
            >
              {showFeedback ? 'Hide Feedback' : 'Show Feedback'}
            </button>
          )}
        </div>
      </div>
      
      <div className="slide-editor-content">
        <div className="slide-thumbnails">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`slide-thumbnail ${selectedSlideIndex === index ? 'selected' : ''}`}
              onClick={() => handleSelectSlide(index)}
              draggable={editable}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="thumbnail-number">{index + 1}</div>
              <h4 className="thumbnail-title">{slide.title}</h4>
              {editable && (
                <button 
                  className="delete-slide-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSlide(index);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="slide-preview">
          {selectedSlideIndex !== null && (
            <Slide
              slide={slides[selectedSlideIndex]}
              index={selectedSlideIndex}
              editable={editable}
              onChange={handleSlideChange}
              feedback={showFeedback ? getSlideFeeback(selectedSlideIndex) : null}
              isSelected={true}
            />
          )}
        </div>
      </div>
      
      {showFeedback && feedback && (
        <FeedbackOverlay 
          feedback={feedback}
          onClose={toggleFeedback}
          onApplySuggestion={(index, suggested) => {
            if (suggested.title || suggested.body) {
              const updatedSlide = { ...slides[index] };
              if (suggested.title) updatedSlide.title = suggested.title;
              if (suggested.body) updatedSlide.body = suggested.body;
              handleSlideChange(index, updatedSlide);
            }
          }}
        />
      )}
    </div>
  );
};

export default SlideEditor;