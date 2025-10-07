import React, { useState, useEffect } from 'react';
import { SlideForgeDemo } from '../components/SlideForge';
import '../components/SlideForge/SlideViewerSSR.css';

/**
 * SlideForge Demo Page
 * 
 * A page component that demonstrates the SlideForge presentation system
 * and allows users to test it with different themes and slide decks.
 */
const SlideForgeTestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    document.title = 'SlideForge Demo | PulseDev';
    
    // Analytics tracking could go here
    
    return () => {
      // Cleanup
    };
  }, []);
  
  return (
    <div className="page slideforge-test-page">
      <header className="page-header">
        <h1>SlideForge Presentation System</h1>
        <p className="page-description">
          Server-side rendered slide presentation component for PulseDev
        </p>
      </header>
      
      <main className="page-content">
        {isLoading ? (
          <div className="loading-indicator">Loading SlideForge demo...</div>
        ) : error ? (
          <div className="error-message">
            <h3>Error Loading Demo</h3>
            <p>{error.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <div className="demo-container">
            <SlideForgeDemo />
          </div>
        )}
        
        <div className="features-section">
          <h2>SlideForge Features</h2>
          <ul className="feature-list">
            <li>
              <strong>Server-Side Rendering</strong> — Optimized for fast initial load and SEO
            </li>
            <li>
              <strong>Multiple Slide Types</strong> — Support for title, content, image, bullet points, code, and split slides
            </li>
            <li>
              <strong>Themeable</strong> — Easily switch between different visual themes
            </li>
            <li>
              <strong>Responsive</strong> — Looks great on all devices and screen sizes
            </li>
            <li>
              <strong>API Integration</strong> — Create and manage slide decks through a simple API
            </li>
            <li>
              <strong>MCP Compatible</strong> — Works seamlessly within the PulseDev MCP architecture
            </li>
          </ul>
        </div>
        
        <div className="integration-section">
          <h2>Integration Examples</h2>
          <div className="code-example">
            <h3>Basic Usage</h3>
            <pre>
              <code>{`
import { SlideViewerSSR } from '../components/SlideForge';
import { generateSampleSlideDeck } from '../components/SlideForge/slideDeckUtils';

const MyPage = () => {
  const slideDeck = generateSampleSlideDeck();
  
  return (
    <SlideViewerSSR 
      slideDeck={slideDeck} 
      theme="default" 
      showControls={true} 
    />
  );
};
              `}</code>
            </pre>
          </div>
          
          <div className="code-example">
            <h3>Loading from API</h3>
            <pre>
              <code>{`
import { SlideViewerSSR } from '../components/SlideForge';
import { useState, useEffect } from 'react';

const PresentationPage = ({ deckId }) => {
  const [slideDeck, setSlideDeck] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch slide deck from API
    fetch(\`/api/slideforge/decks/\${deckId}\`)
      .then(res => res.json())
      .then(data => {
        setSlideDeck(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching slide deck:', err);
        setIsLoading(false);
      });
  }, [deckId]);
  
  if (isLoading) return <div>Loading presentation...</div>;
  if (!slideDeck) return <div>Presentation not found</div>;
  
  return (
    <SlideViewerSSR 
      slideDeck={slideDeck} 
      theme="dark" 
    />
  );
};
              `}</code>
            </pre>
          </div>
        </div>
      </main>
      
      <footer className="page-footer">
        <p>SlideForge is part of the PulseDev platform. Documentation available in the <a href="#">SlideForge Guide</a>.</p>
      </footer>
    </div>
  );
};

export default SlideForgeTestPage;