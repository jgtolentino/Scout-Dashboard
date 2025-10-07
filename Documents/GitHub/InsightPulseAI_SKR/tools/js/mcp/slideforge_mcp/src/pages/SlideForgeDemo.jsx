import React, { useState, useEffect } from 'react';
import SlideViewerSSR from '../components/SlideViewerSSR';

/**
 * SlideForgeDemo - Demo page for slide decks
 * This component demonstrates the SlideViewerSSR for both client and server side rendering
 */
const SlideForgeDemo = ({ initialDeck = null, filename }) => {
  const [deck, setDeck] = useState(initialDeck);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(!initialDeck);
  const [theme, setTheme] = useState('default');
  const [error, setError] = useState(null);

  // Fetch slide deck if not provided
  useEffect(() => {
    if (!initialDeck && filename) {
      setLoading(true);
      fetch(`/api/slides/${filename}.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load slide deck: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          setDeck(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [initialDeck, filename]);

  // Handle navigation
  const handleNavigate = (slideIndex) => {
    if (deck && deck.slides && slideIndex >= 0 && slideIndex < deck.slides.length) {
      setCurrentSlide(slideIndex);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="slideforge-demo-container">
      <div className="slideforge-demo-header">
        <h1>SlideForge Demo</h1>
        <div className="theme-selector">
          <label htmlFor="theme-select">Theme:</label>
          <select 
            id="theme-select" 
            value={theme} 
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      <div className="slideforge-demo-content">
        {loading ? (
          <div className="loading-indicator">Loading slide deck...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : deck ? (
          <>
            <div className="slide-navigation-full">
              <div className="slide-thumbnails">
                {deck.slides.map((slide, index) => (
                  <div 
                    key={index}
                    className={`slide-thumbnail ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => handleNavigate(index)}
                  >
                    <span className="thumbnail-number">{index + 1}</span>
                    <span className="thumbnail-title">{slide.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="slide-viewer-container">
              <SlideViewerSSR 
                deck={deck}
                currentSlide={currentSlide}
                showNavigation={true}
                theme={theme}
                onNavigate={handleNavigate}
              />
            </div>
          </>
        ) : (
          <div className="no-deck-message">No slide deck available</div>
        )}
      </div>

      <style jsx>{`
        .slideforge-demo-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .slideforge-demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .slideforge-demo-content {
          display: flex;
          flex: 1;
          gap: 20px;
        }
        
        .slide-navigation-full {
          width: 250px;
          overflow-y: auto;
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 10px;
        }
        
        .slide-thumbnails {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .slide-thumbnail {
          padding: 10px;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        .slide-thumbnail.active {
          border-color: #1a73e8;
          background-color: #e8f0fe;
        }
        
        .slide-thumbnail:hover:not(.active) {
          background-color: #f8f9fa;
        }
        
        .thumbnail-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: #1a73e8;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          margin-right: 10px;
        }
        
        .thumbnail-title {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .slide-viewer-container {
          flex: 1;
          height: 600px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .theme-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .theme-selector select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background-color: white;
        }
        
        .loading-indicator,
        .error-message,
        .no-deck-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          font-size: 18px;
          color: #5f6368;
        }
        
        .error-message {
          color: #d93025;
        }
      `}</style>
    </div>
  );
};

export default SlideForgeDemo;