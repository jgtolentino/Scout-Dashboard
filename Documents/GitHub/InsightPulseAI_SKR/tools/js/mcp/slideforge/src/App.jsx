import React, { useState, useEffect } from 'react';
import SlideEditor from './components/SlideEditor';
import './App.css';

const App = () => {
  const [deckData, setDeckData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeView, setActiveView] = useState('editor'); // 'editor', 'preview', 'publish'
  
  // Load the deck data from URL parameter or localStorage
  useEffect(() => {
    const loadDeck = async () => {
      setIsLoading(true);
      
      try {
        // Check for deck ID in URL
        const urlParams = new URLSearchParams(window.location.search);
        const deckId = urlParams.get('deck');
        
        if (deckId) {
          // Load from server/file system
          const response = await fetch(`/slides/generated/${deckId}.json`);
          if (!response.ok) throw new Error('Failed to load deck');
          const data = await response.json();
          setDeckData(data);
        } else {
          // Check localStorage for draft
          const savedDraft = localStorage.getItem('slideforge_draft');
          if (savedDraft) {
            setDeckData(JSON.parse(savedDraft));
          } else {
            // Start with an empty deck
            setDeckData({
              title: 'Untitled Deck',
              slides: [
                {
                  title: 'New Slide',
                  body: 'Click to edit this slide',
                  image_prompt: 'Describe the image for this slide'
                }
              ]
            });
          }
        }
      } catch (err) {
        console.error('Error loading deck:', err);
        setError('Failed to load deck. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeck();
  }, []);
  
  // Save the deck
  const handleSaveDeck = async (updatedDeck) => {
    // Save to localStorage as draft
    localStorage.setItem('slideforge_draft', JSON.stringify(updatedDeck));
    
    // Update state
    setDeckData(updatedDeck);
    
    // In a real app, you would save to server here
    console.log('Deck saved:', updatedDeck);
  };
  
  // Generate a new deck with Claude
  const handleGenerateDeck = async () => {
    const promptInput = document.getElementById('deckgen-prompt').value;
    if (!promptInput.trim()) {
      alert('Please enter a prompt to generate a deck');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call the MCP deckgen agent
      // For demo, we'll simulate it with a timeout
      setTimeout(() => {
        // Example generated deck
        const generatedDeck = {
          title: 'AI Generated Deck',
          slides: [
            {
              title: 'AI Generated Title Slide',
              body: 'Generated from your prompt: ' + promptInput,
              image_prompt: 'AI visualization of the deck concept'
            },
            {
              title: 'Key Features',
              body: '• Feature 1: Description\n• Feature 2: Description\n• Feature 3: Description',
              image_prompt: 'Visual showing the key features'
            },
            {
              title: 'Benefits',
              body: '• Benefit 1: Details\n• Benefit 2: Details\n• Benefit 3: Details',
              image_prompt: 'People experiencing the benefits'
            },
            {
              title: 'Call to Action',
              body: 'Next steps and how to proceed\nContact information\nWebsite',
              image_prompt: 'Engaging call to action visual'
            }
          ]
        };
        
        setDeckData(generatedDeck);
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Error generating deck:', err);
      setError('Failed to generate deck. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Get AI feedback
  const handleGetFeedback = async () => {
    if (!deckData) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call the MCP feedback agent
      // For demo, we'll simulate it with a timeout
      setTimeout(() => {
        // Example feedback
        const feedbackData = {
          overall_feedback: {
            strengths: [
              'Clear structure with logical flow',
              'Concise bullet points'
            ],
            weaknesses: [
              'Generic content lacking specificity',
              'Missing compelling visuals',
              'Limited audience targeting'
            ],
            recommendations: [
              'Add specific metrics or data points to strengthen claims',
              'Include a use case or customer story slide',
              'Define audience more clearly in introduction'
            ]
          },
          slide_feedback: deckData.slides.map((slide, index) => ({
            slide_index: index,
            title: slide.title,
            feedback: `Slide ${index + 1} could be more impactful with specific examples.`,
            suggested_revisions: {
              title: index === 0 ? slide.title + ': Reimagined' : null,
              body: slide.body + '\n• [Suggested additional point]'
            }
          }))
        };
        
        setFeedback(feedbackData);
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Error getting feedback:', err);
      setError('Failed to get feedback. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Publish the deck
  const handlePublish = async () => {
    if (!deckData) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call the MCP publish action
      // For demo, we'll simulate it with a timeout
      setTimeout(() => {
        // Simulate publication
        const publishUrl = `https://slideforge.example.com/d/${Date.now().toString(36)}`;
        alert(`Deck published successfully!\nURL: ${publishUrl}`);
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Error publishing deck:', err);
      setError('Failed to publish deck. Please try again.');
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SlideForge</h1>
        <div className="view-controls">
          <button 
            className={`view-btn ${activeView === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveView('editor')}
          >
            Editor
          </button>
          <button 
            className={`view-btn ${activeView === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveView('preview')}
          >
            Preview
          </button>
          <button 
            className={`view-btn ${activeView === 'publish' ? 'active' : ''}`}
            onClick={() => setActiveView('publish')}
          >
            Publish
          </button>
        </div>
      </header>
      
      <main className="app-content">
        {activeView === 'editor' && (
          <div className="editor-view">
            <div className="deck-generator">
              <h2>Generate New Deck</h2>
              <div className="generator-input">
                <textarea 
                  id="deckgen-prompt"
                  placeholder="Describe the deck you want to generate..."
                  rows={3}
                ></textarea>
                <button onClick={handleGenerateDeck}>Generate with AI</button>
              </div>
            </div>
            
            {deckData && (
              <SlideEditor
                slides={deckData.slides}
                deckTitle={deckData.title}
                editable={true}
                feedback={feedback}
                onSave={handleSaveDeck}
              />
            )}
            
            <div className="editor-actions">
              <button onClick={handleGetFeedback} className="feedback-btn">
                Get AI Feedback
              </button>
            </div>
          </div>
        )}
        
        {activeView === 'preview' && deckData && (
          <div className="preview-view">
            <h2>{deckData.title}</h2>
            <div className="preview-slides">
              {deckData.slides.map((slide, index) => (
                <div key={index} className="preview-slide">
                  <h3>{slide.title}</h3>
                  <div className="preview-body">
                    {slide.body.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <div className="preview-image">
                    <p><em>Image: {slide.image_prompt}</em></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeView === 'publish' && (
          <div className="publish-view">
            <h2>Publish Your Deck</h2>
            <div className="publish-options">
              <div className="publish-option">
                <h3>Web</h3>
                <p>Publish as a web page with URL</p>
                <button onClick={handlePublish}>Publish to Web</button>
              </div>
              <div className="publish-option">
                <h3>Export</h3>
                <p>Download in various formats</p>
                <div className="export-buttons">
                  <button>Export as PDF</button>
                  <button>Export as PPTX</button>
                  <button>Export as Images</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;