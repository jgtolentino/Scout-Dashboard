/**
 * App.jsx
 * 
 * Main application component for the Prompt Lab web explorer.
 * Provides navigation, search, and management of prompts.
 */

import React, { useState, useEffect } from 'react';
import { searchPrompts, getPromptCollectionInfo } from './api/promptApi';
import PromptViewer from './components/PromptViewer';
import EditorPanel from './components/EditorPanel';
import TagList from './components/TagList';

const App = () => {
  const [view, setView] = useState('browse'); // browse, edit, analyze
  const [prompts, setPrompts] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load initial data
  useEffect(() => {
    loadCollectionInfo();
    searchPromptsWithFilters();
  }, []);
  
  // Load collection info
  const loadCollectionInfo = async () => {
    try {
      const info = await getPromptCollectionInfo();
      setCollectionInfo(info);
    } catch (err) {
      setError('Failed to load collection info');
      console.error(err);
    }
  };
  
  // Search prompts with filters
  const searchPromptsWithFilters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const criteria = {
        query: searchQuery,
        tags: selectedTags,
        category: selectedCategory
      };
      
      const results = await searchPrompts(criteria);
      setPrompts(results);
      
      if (results.length === 0) {
        setSelectedPrompt(null);
      }
    } catch (err) {
      setError('Failed to search prompts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchPromptsWithFilters();
  };
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  // Handle prompt selection
  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    setView('browse');
  };
  
  // Handle prompt save
  const handleSavePrompt = (updatedPrompt) => {
    // In a real app, this would call an API to save the prompt
    console.log('Saving prompt:', updatedPrompt);
    
    // Update local state
    setPrompts(prompts.map(prompt => 
      prompt.id === updatedPrompt.id ? updatedPrompt : prompt
    ));
    
    setSelectedPrompt(updatedPrompt);
    setView('browse');
  };
  
  // Handle creating a variation
  const handleCreateVariation = (variation) => {
    // In a real app, this would call an API to create a new prompt variation
    console.log('Creating variation:', variation);
    
    // For now, just switch back to browse view
    setView('browse');
  };
  
  // Render available categories
  const renderCategories = () => {
    if (!collectionInfo || !collectionInfo.collections) {
      return null;
    }
    
    return (
      <select 
        className="category-select" 
        value={selectedCategory}
        onChange={handleCategorySelect}
      >
        <option value="">All Categories</option>
        {collectionInfo.collections.map((collection, index) => (
          <option key={`category-${index}`} value={collection.name}>
            {collection.name} ({collection.fileCount})
          </option>
        ))}
      </select>
    );
  };
  
  // Extract all unique tags from prompts
  const getAllTags = () => {
    const tagSet = new Set();
    
    prompts.forEach(prompt => {
      if (prompt.tags) {
        prompt.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet);
  };
  
  return (
    <div className="prompt-lab">
      <header className="app-header">
        <h1>Prompt Lab</h1>
        <div className="view-controls">
          <button
            className={`view-button ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse
          </button>
          <button
            className={`view-button ${view === 'edit' ? 'active' : ''}`}
            onClick={() => setView('edit')}
            disabled={!selectedPrompt}
          >
            Edit
          </button>
          <button
            className={`view-button ${view === 'analyze' ? 'active' : ''}`}
            onClick={() => setView('analyze')}
            disabled={!selectedPrompt}
          >
            Analyze
          </button>
        </div>
      </header>
      
      <div className="app-content">
        <aside className="app-sidebar">
          <div className="search-container">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="search-input"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>
            
            <div className="filter-options">
              {renderCategories()}
              
              <div className="tag-filters">
                <h4>Filter by Tags</h4>
                <div className="available-tags">
                  {getAllTags().map((tag, index) => (
                    <button
                      key={`tag-filter-${index}`}
                      className={`tag-filter-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="prompt-list">
            <h3>Prompts ({prompts.length})</h3>
            
            {loading ? (
              <div className="loading-indicator">Loading prompts...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : prompts.length === 0 ? (
              <div className="empty-list">No prompts found</div>
            ) : (
              <ul className="prompt-items">
                {prompts.map((prompt, index) => (
                  <li 
                    key={`prompt-${index}`}
                    className={`prompt-item ${selectedPrompt && selectedPrompt.id === prompt.id ? 'selected' : ''}`}
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <span className="prompt-name">{prompt.name}</span>
                    <span className="prompt-category">{prompt.category}</span>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="prompt-item-tags">
                        {prompt.tags.map((tag, tagIndex) => (
                          <span key={`prompt-tag-${tagIndex}`} className="prompt-item-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        
        <main className="main-content">
          {!selectedPrompt ? (
            <div className="no-prompt-selected">
              <h2>Welcome to Prompt Lab</h2>
              <p>Select a prompt from the sidebar to view, edit, or analyze it.</p>
              <p>You can also search for prompts by name, filter by category, or filter by tags.</p>
            </div>
          ) : view === 'browse' ? (
            <PromptViewer promptId={selectedPrompt.id} promptPath={selectedPrompt.path} />
          ) : view === 'edit' ? (
            <EditorPanel prompt={selectedPrompt} onSave={handleSavePrompt} onCreateVariation={handleCreateVariation} />
          ) : view === 'analyze' ? (
            <div className="analyze-view">
              <h2>Analyze: {selectedPrompt.name}</h2>
              <PromptViewer promptId={selectedPrompt.id} promptPath={selectedPrompt.path} />
            </div>
          ) : null}
        </main>
      </div>
      
      <footer className="app-footer">
        <div className="collection-info">
          {collectionInfo && (
            <>
              <span>Total Prompts: {collectionInfo.totalFiles || 0}</span>
              <span>Last Updated: {collectionInfo.lastUpdated || 'Unknown'}</span>
            </>
          )}
        </div>
        <div className="footer-links">
          <a href="/docs/prompt_lab" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer">
            API Reference
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;