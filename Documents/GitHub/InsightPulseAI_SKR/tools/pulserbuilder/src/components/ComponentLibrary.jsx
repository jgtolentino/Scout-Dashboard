import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { COMPONENT_TYPES } from '../constants/componentTypes';
import { SearchIcon, StarIcon } from '../icons';
import '../styles/ComponentLibrary.css';

const ComponentItem = ({ type, name, icon, description, onSelect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'COMPONENT',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`component-item ${isDragging ? 'dragging' : ''}`}
      onClick={() => onSelect(type)}
    >
      <div className="component-icon">{icon}</div>
      <div className="component-info">
        <h4>{name}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
};

const ComponentLibrary = ({ onSelectComponent, onGenerateComponent, isGenerating }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customPrompt, setCustomPrompt] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);

  // Load saved favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('componentFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    const savedRecent = localStorage.getItem('recentComponents');
    if (savedRecent) {
      setRecentlyUsed(JSON.parse(savedRecent));
    }
  }, []);

  // Filter components based on search and category
  const filteredComponents = Object.entries(COMPONENT_TYPES)
    .filter(([type, component]) => {
      // Filter by search term
      const matchesSearch = 
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.toLowerCase().includes(searchTerm.toLowerCase());
        
      // Filter by category
      const matchesCategory = 
        activeCategory === 'all' || 
        component.category === activeCategory ||
        (activeCategory === 'favorites' && favorites.includes(type)) ||
        (activeCategory === 'recent' && recentlyUsed.includes(type));
        
      return matchesSearch && matchesCategory;
    })
    .map(([type, component]) => ({
      type,
      ...component,
      isFavorite: favorites.includes(type),
    }));

  const handleComponentSelect = (type) => {
    onSelectComponent(type);
    
    // Update recently used components
    const updatedRecent = [type, ...recentlyUsed.filter(t => t !== type)].slice(0, 10);
    setRecentlyUsed(updatedRecent);
    localStorage.setItem('recentComponents', JSON.stringify(updatedRecent));
  };

  const toggleFavorite = (type, event) => {
    event.stopPropagation();
    
    let updatedFavorites;
    if (favorites.includes(type)) {
      updatedFavorites = favorites.filter(t => t !== type);
    } else {
      updatedFavorites = [...favorites, type];
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('componentFavorites', JSON.stringify(updatedFavorites));
  };

  const handleGenerateFromPrompt = () => {
    if (customPrompt.trim() !== '') {
      onGenerateComponent(customPrompt);
    }
  };

  // Get unique categories for filter tabs
  const categories = ['all', 'favorites', 'recent', ...new Set(
    Object.values(COMPONENT_TYPES).map(component => component.category)
  )];

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>Components</h3>
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="component-list">
        {filteredComponents.map(({ type, name, icon, description, isFavorite }) => (
          <div key={type} className="component-item-container">
            <ComponentItem
              type={type}
              name={name}
              icon={icon}
              description={description}
              onSelect={handleComponentSelect}
            />
            <button
              className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
              onClick={(e) => toggleFavorite(type, e)}
            >
              <StarIcon filled={isFavorite} />
            </button>
          </div>
        ))}
        
        {filteredComponents.length === 0 && (
          <div className="no-components">
            <p>No components found. Try a different search term or category.</p>
          </div>
        )}
      </div>
      
      <div className="generate-component">
        <h4>Generate Custom Component</h4>
        <textarea
          placeholder="Describe the component you need..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
        <button 
          onClick={handleGenerateFromPrompt}
          disabled={isGenerating || customPrompt.trim() === ''}
        >
          {isGenerating ? 'Generating...' : 'Generate Component'}
        </button>
      </div>
    </div>
  );
};

export default ComponentLibrary;