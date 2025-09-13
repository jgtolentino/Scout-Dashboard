import React from 'react';
import './SlideViewerSSR.css';

/**
 * SlideViewerSSR - Server-Side Renderable Slide Deck Component
 * 
 * This component renders a slide deck from JSON data, designed to work in both
 * server-side and client-side rendering environments.
 * 
 * Features:
 * - Renders all slide types (title, content, image, bullets, code, split)
 * - Support for themes (default, dark, light)
 * - Optional navigation controls
 * - Fully SSR-compatible
 * - Accessible design
 */
const SlideViewerSSR = ({ 
  deck, 
  currentSlide = 0, 
  showNavigation = false,
  theme = 'default',
  onNavigate = null,
  width = '100%',
  height = '100%'
}) => {
  // Safety check for missing deck data
  if (!deck || !deck.slides || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    return (
      <div className={`slideforge-container theme-${theme}`} style={{ width, height }}>
        <div className="slideforge-error">
          <h2>Error: Invalid Slide Deck Data</h2>
          <p>The slide deck data is missing or malformed.</p>
        </div>
      </div>
    );
  }

  // Ensure currentSlide is within bounds
  const validSlideIndex = Math.max(0, Math.min(currentSlide, deck.slides.length - 1));
  const slide = deck.slides[validSlideIndex];
  
  // Determine slide type if not explicitly set
  const slideType = slide.type || determineSlideType(slide, validSlideIndex, deck.slides.length);

  // SSR-safe container class determination
  const containerClasses = [
    'slideforge-container',
    `theme-${theme}`,
    `slide-type-${slideType}`,
    slide.customClass || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={{ width, height }}>
      <div className="slideforge-content">
        {renderSlide(slide, slideType, deck.title)}
      </div>
      
      {showNavigation && (
        <div className="slideforge-navigation">
          <button 
            className="nav-button prev" 
            disabled={validSlideIndex === 0}
            onClick={() => onNavigate && onNavigate(validSlideIndex - 1)}
            aria-label="Previous slide"
          >
            &larr;
          </button>
          <div className="slide-counter">
            {validSlideIndex + 1} / {deck.slides.length}
          </div>
          <button 
            className="nav-button next" 
            disabled={validSlideIndex === deck.slides.length - 1}
            onClick={() => onNavigate && onNavigate(validSlideIndex + 1)}
            aria-label="Next slide"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Determine the slide type based on content and position
 */
function determineSlideType(slide, index, totalSlides) {
  if (index === 0) return 'title';
  if (index === totalSlides - 1) return 'end';
  if (slide.image_prompt && slide.bullets && slide.bullets.length > 0) return 'split';
  if (slide.code) return 'code';
  if (slide.bullets && slide.bullets.length > 0) return 'bullets';
  if (slide.content && typeof slide.content === 'string') return 'content';
  return 'content';
}

/**
 * Render a slide based on its type
 */
function renderSlide(slide, slideType, deckTitle) {
  switch (slideType) {
    case 'title':
      return renderTitleSlide(slide, deckTitle);
    case 'end':
      return renderEndSlide(slide);
    case 'split':
      return renderSplitSlide(slide);
    case 'code':
      return renderCodeSlide(slide);
    case 'bullets':
      return renderBulletsSlide(slide);
    case 'content':
    default:
      return renderContentSlide(slide);
  }
}

/**
 * Render title slide
 */
function renderTitleSlide(slide, deckTitle) {
  return (
    <div className="slide title-slide">
      <h1 className="deck-title">{slide.title || deckTitle}</h1>
      {slide.subtitle && <h2 className="deck-subtitle">{slide.subtitle}</h2>}
      {slide.presenter && <div className="presenter-info">{slide.presenter}</div>}
      {slide.date && <div className="date-info">{slide.date}</div>}
    </div>
  );
}

/**
 * Render end slide
 */
function renderEndSlide(slide) {
  return (
    <div className="slide end-slide">
      <h2 className="end-title">{slide.title}</h2>
      {slide.subtitle && <h3 className="end-subtitle">{slide.subtitle}</h3>}
      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="end-bullets">
          {slide.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}
      {slide.callToAction && (
        <div className="call-to-action">{slide.callToAction}</div>
      )}
    </div>
  );
}

/**
 * Render content slide (general purpose)
 */
function renderContentSlide(slide) {
  return (
    <div className="slide content-slide">
      <h2 className="slide-title">{slide.title}</h2>
      {slide.subtitle && <h3 className="slide-subtitle">{slide.subtitle}</h3>}
      
      {slide.content && (
        <div className="slide-content">{slide.content}</div>
      )}
      
      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="slide-bullets">
          {slide.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}
      
      {slide.image_prompt && (
        <div className="slide-image-placeholder">
          <div className="image-description">{slide.image_prompt}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Render bullets slide (focused on bullet points)
 */
function renderBulletsSlide(slide) {
  return (
    <div className="slide bullets-slide">
      <h2 className="slide-title">{slide.title}</h2>
      {slide.subtitle && <h3 className="slide-subtitle">{slide.subtitle}</h3>}
      
      <ul className="slide-bullets">
        {slide.bullets.map((bullet, i) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Render split slide (image + content side by side)
 */
function renderSplitSlide(slide) {
  return (
    <div className="slide split-slide">
      <h2 className="slide-title">{slide.title}</h2>
      {slide.subtitle && <h3 className="slide-subtitle">{slide.subtitle}</h3>}
      
      <div className="split-content">
        <div className="split-text">
          <ul className="slide-bullets">
            {slide.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
        
        <div className="split-image">
          <div className="slide-image-placeholder">
            <div className="image-description">{slide.image_prompt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render code slide with syntax highlighting placeholders
 */
function renderCodeSlide(slide) {
  return (
    <div className="slide code-slide">
      <h2 className="slide-title">{slide.title}</h2>
      {slide.subtitle && <h3 className="slide-subtitle">{slide.subtitle}</h3>}
      
      <pre className="code-block">
        <code>
          {slide.code}
        </code>
      </pre>
      
      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="slide-bullets">
          {slide.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SlideViewerSSR;