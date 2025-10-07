import React, { useState } from 'react';
import SlideViewerSSR from './SlideViewerSSR';
import { generateSampleSlideDeck } from './slideDeckUtils';
import './SlideViewerSSR.css';

/**
 * SlideForge Demo Component
 * 
 * Demonstrates the usage of the SlideViewerSSR component
 * with a sample slide deck and theme switching.
 */
const SlideForgeDemo = () => {
  const [theme, setTheme] = useState('default');
  const sampleSlideDeck = generateSampleSlideDeck();
  
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };
  
  return (
    <div className="slideforge-demo">
      <div className="demo-controls">
        <h2>SlideForge Demo</h2>
        <div className="theme-selector">
          <label htmlFor="theme-select">Select Theme: </label>
          <select 
            id="theme-select" 
            value={theme} 
            onChange={handleThemeChange}
          >
            <option value="default">Default Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
        </div>
      </div>
      
      <div className="slideforge-demo-viewer">
        <SlideViewerSSR 
          slideDeck={sampleSlideDeck} 
          theme={theme}
          showControls={true}
        />
      </div>
      
      <div className="demo-footer">
        <p>
          <strong>Note:</strong> This is a demonstration of the SlideViewerSSR component. 
          In a real implementation, slide decks would typically be loaded from an API 
          or file system and rendered server-side.
        </p>
      </div>
    </div>
  );
};

export default SlideForgeDemo;