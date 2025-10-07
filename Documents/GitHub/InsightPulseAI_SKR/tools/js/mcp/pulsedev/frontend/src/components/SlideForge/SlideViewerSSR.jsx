import React from 'react';

/**
 * SlideViewerSSR Component
 * 
 * A server-side renderable component for displaying slide decks.
 * This component can render various slide types and supports navigation controls.
 * 
 * @param {Object} props Component props
 * @param {Object} props.slideDeck The slide deck JSON structure
 * @param {boolean} props.showControls Whether to display navigation controls
 * @param {number} props.initialSlide The initial slide index to display
 * @param {string} props.theme Theme name for styling (default, dark, etc.)
 * @param {Function} props.onSlideChange Callback when slide changes
 */
const SlideViewerSSR = ({
  slideDeck,
  showControls = true,
  initialSlide = 0,
  theme = 'default',
  onSlideChange
}) => {
  if (!slideDeck || !slideDeck.slides || !Array.isArray(slideDeck.slides)) {
    return (
      <div className="slide-viewer-error">
        <h2>Error: Invalid slide deck format</h2>
        <p>The provided slide deck is missing or has an invalid format.</p>
      </div>
    );
  }

  const { title, description, slides, author, createdAt, lastModified } = slideDeck;
  
  // Function to render different slide types
  const renderSlide = (slide, index) => {
    const { type, content, title, subtitle, imageUrl, alt, bullets, code, codeLanguage } = slide;
    
    switch (type) {
      case 'title':
        return (
          <div className={`slide slide-title slide-${index}`} key={index}>
            <h1>{title}</h1>
            {subtitle && <h2>{subtitle}</h2>}
            {content && <div className="slide-content">{content}</div>}
          </div>
        );
        
      case 'content':
        return (
          <div className={`slide slide-content slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            <div className="slide-body">{content}</div>
          </div>
        );
        
      case 'image':
        return (
          <div className={`slide slide-image slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            <div className="slide-image-container">
              <img src={imageUrl} alt={alt || title || 'Slide image'} />
              {content && <div className="slide-caption">{content}</div>}
            </div>
          </div>
        );
        
      case 'bullets':
        return (
          <div className={`slide slide-bullets slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            <ul className="slide-bullet-list">
              {bullets && bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
            {content && <div className="slide-content">{content}</div>}
          </div>
        );
        
      case 'code':
        return (
          <div className={`slide slide-code slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            <div className="slide-code-container">
              <pre>
                <code className={codeLanguage || 'language-javascript'}>
                  {code}
                </code>
              </pre>
            </div>
            {content && <div className="slide-content">{content}</div>}
          </div>
        );
        
      case 'split':
        return (
          <div className={`slide slide-split slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            <div className="slide-split-container">
              <div className="slide-split-left">
                {slide.leftContent}
              </div>
              <div className="slide-split-right">
                {slide.rightContent}
              </div>
            </div>
          </div>
        );
        
      case 'end':
        return (
          <div className={`slide slide-end slide-${index}`} key={index}>
            <h1>{title || 'Thank You'}</h1>
            {content && <div className="slide-content">{content}</div>}
            {author && <div className="slide-author">{author}</div>}
          </div>
        );
        
      default:
        return (
          <div className={`slide slide-default slide-${index}`} key={index}>
            {title && <h2>{title}</h2>}
            {content && <div className="slide-content">{content}</div>}
          </div>
        );
    }
  };

  return (
    <div className={`slide-viewer slide-viewer-ssr slide-theme-${theme}`}>
      <div className="slide-deck-info">
        <h1 className="slide-deck-title">{title}</h1>
        {description && <p className="slide-deck-description">{description}</p>}
        {author && <p className="slide-deck-author">By {author}</p>}
        {lastModified && <p className="slide-deck-modified">Last updated: {new Date(lastModified).toLocaleDateString()}</p>}
      </div>
      
      <div className="slide-deck-container">
        {slides.map(renderSlide)}
      </div>
      
      {showControls && (
        <div className="slide-controls">
          <div className="slide-navigation">
            <button className="slide-prev-btn">Previous</button>
            <span className="slide-counter">
              <span className="current-slide">{initialSlide + 1}</span>
              <span className="slide-counter-separator">/</span>
              <span className="total-slides">{slides.length}</span>
            </span>
            <button className="slide-next-btn">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Default props for SlideViewerSSR
SlideViewerSSR.defaultProps = {
  slideDeck: null,
  showControls: true,
  initialSlide: 0,
  theme: 'default',
  onSlideChange: () => {}
};

export default SlideViewerSSR;