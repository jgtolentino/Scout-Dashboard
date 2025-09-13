import React, { useState, useEffect } from 'react';
import SlideEditor from '../components/deck/SlideEditor';
import SlideList from '../components/deck/SlideList';
import SlidePreview from '../components/deck/SlidePreview';
import ThemeSelector from '../components/deck/ThemeSelector';
import ToolbarDeck from '../components/deck/ToolbarDeck';
import '../styles/DeckBuilder.css';

/**
 * DeckBuilder - Gamma-style slide deck builder interface
 * Handles the specific UI and functionality for building presentations/slides
 */
const DeckBuilder = ({ projectName, isLoading }) => {
  const [slides, setSlides] = useState([
    { id: 'slide_1', title: 'Title Slide', type: 'title', content: '' },
    { id: 'slide_2', title: 'Agenda', type: 'content', content: '' }
  ]);
  const [currentSlide, setCurrentSlide] = useState('slide_1');
  const [currentTheme, setCurrentTheme] = useState('default');
  const [editMode, setEditMode] = useState('design'); // design, content, present
  const [slideContent, setSlideContent] = useState({});
  
  // Load slide content when current slide changes
  useEffect(() => {
    if (isLoading) return;
    
    // In a real implementation, this would load content from the deck schema
    // For now, we'll use mock data
    const mockContent = {
      slide_1: {
        title: projectName || 'Presentation Title',
        subtitle: 'Created with SlideForge',
        notes: 'Welcome slide for the presentation',
        background: null
      },
      slide_2: {
        title: 'Agenda',
        bullets: [
          'Introduction',
          'Key Points',
          'Demonstration',
          'Q&A'
        ],
        notes: 'Overview of what will be covered',
        background: null
      }
    };
    
    setSlideContent(prev => ({
      ...prev,
      ...mockContent
    }));
  }, [currentSlide, isLoading, projectName]);
  
  // Handle slide content updates
  const handleUpdateSlideContent = (slideId, field, value) => {
    setSlideContent(prev => ({
      ...prev,
      [slideId]: {
        ...(prev[slideId] || {}),
        [field]: value
      }
    }));
  };
  
  // Handle adding a new slide
  const handleAddSlide = (type = 'content') => {
    const newSlideId = `slide_${slides.length + 1}`;
    const newSlide = {
      id: newSlideId,
      title: `Slide ${slides.length + 1}`,
      type
    };
    
    setSlides(prev => [...prev, newSlide]);
    setCurrentSlide(newSlideId);
    
    // Initialize content for the new slide
    const initialContent = {
      title: `Slide ${slides.length + 1}`,
      bullets: type === 'bullets' ? ['Bullet point 1', 'Bullet point 2'] : [],
      content: type === 'content' ? 'Enter content here' : '',
      notes: ''
    };
    
    setSlideContent(prev => ({
      ...prev,
      [newSlideId]: initialContent
    }));
  };
  
  // Handle deleting a slide
  const handleDeleteSlide = (slideId) => {
    if (slides.length <= 1) {
      alert('Cannot delete the only slide in the presentation');
      return;
    }
    
    const slideIndex = slides.findIndex(s => s.id === slideId);
    
    // Determine the next slide to select
    let nextSlideId;
    if (slideIndex > 0) {
      nextSlideId = slides[slideIndex - 1].id;
    } else if (slides.length > 1) {
      nextSlideId = slides[1].id;
    }
    
    setSlides(prev => prev.filter(s => s.id !== slideId));
    
    if (currentSlide === slideId && nextSlideId) {
      setCurrentSlide(nextSlideId);
    }
    
    // Remove content for the deleted slide
    setSlideContent(prev => {
      const newContent = { ...prev };
      delete newContent[slideId];
      return newContent;
    });
  };
  
  // Handle slide reordering
  const handleReorderSlides = (sourceIndex, destinationIndex) => {
    if (destinationIndex < 0 || destinationIndex >= slides.length) {
      return;
    }
    
    setSlides(prev => {
      const newSlides = [...prev];
      const [removed] = newSlides.splice(sourceIndex, 1);
      newSlides.splice(destinationIndex, 0, removed);
      return newSlides;
    });
  };
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };
  
  // Handle edit mode change
  const handleEditModeChange = (mode) => {
    setEditMode(mode);
  };
  
  return (
    <div className="deck-builder">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Creating your presentation...</div>
        </div>
      ) : (
        <>
          <div className="deck-builder-toolbars">
            <ToolbarDeck 
              editMode={editMode} 
              onEditModeChange={handleEditModeChange}
              onAddSlide={handleAddSlide}
            />
            <ThemeSelector 
              currentTheme={currentTheme} 
              onThemeChange={handleThemeChange} 
            />
          </div>
          
          <div className="deck-builder-content">
            <SlideList 
              slides={slides}
              currentSlide={currentSlide}
              onSelectSlide={setCurrentSlide}
              onDeleteSlide={handleDeleteSlide}
              onReorderSlides={handleReorderSlides}
              slideContent={slideContent}
            />
            
            {editMode === 'design' || editMode === 'content' ? (
              <SlideEditor 
                slide={slides.find(s => s.id === currentSlide)}
                content={slideContent[currentSlide] || {}}
                theme={currentTheme}
                editMode={editMode}
                onUpdateContent={(field, value) => handleUpdateSlideContent(currentSlide, field, value)}
              />
            ) : (
              <SlidePreview 
                slides={slides}
                slideContent={slideContent}
                currentSlide={currentSlide}
                theme={currentTheme}
                onNavigateSlide={setCurrentSlide}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DeckBuilder;