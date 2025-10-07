/**
 * slideDeckUtils.js
 * Utility functions for creating, manipulating and rendering slide decks
 */

const fs = require('fs');
const path = require('path');

/**
 * Load a slide deck from a JSON file
 * @param {string} filename - The filename (without extension)
 * @param {string} slidesDir - The directory where slides are stored
 * @returns {Object} The slide deck data
 */
function loadSlideDeck(filename, slidesDir = './public/slides') {
  const deckPath = path.resolve(slidesDir, `${filename}.json`);
  if (!fs.existsSync(deckPath)) {
    throw new Error(`Slide deck file not found: ${deckPath}`);
  }
  
  try {
    return JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  } catch (error) {
    throw new Error(`Error parsing slide deck: ${error.message}`);
  }
}

/**
 * Save a slide deck to a JSON file
 * @param {Object} deck - The slide deck data
 * @param {string} filename - The filename (without extension)
 * @param {string} slidesDir - The directory where slides are stored
 */
function saveSlideDeck(deck, filename, slidesDir = './public/slides') {
  // Ensure the directory exists
  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }
  
  const deckPath = path.resolve(slidesDir, `${filename}.json`);
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2), 'utf8');
  return deckPath;
}

/**
 * Create a new empty slide deck
 * @param {string} title - The deck title
 * @param {string} description - The deck description
 * @returns {Object} The new slide deck
 */
function createEmptySlideDeck(title, description = '') {
  return {
    title,
    description,
    slides: [
      {
        title,
        subtitle: description,
        type: 'title'
      }
    ]
  };
}

/**
 * Add a new slide to a deck
 * @param {Object} deck - The slide deck
 * @param {Object} slide - The slide to add
 * @param {number} position - The position to insert the slide (defaults to end)
 * @returns {Object} The updated deck
 */
function addSlide(deck, slide, position = -1) {
  if (!deck.slides) {
    deck.slides = [];
  }
  
  const pos = position < 0 ? deck.slides.length : Math.min(position, deck.slides.length);
  deck.slides.splice(pos, 0, slide);
  return deck;
}

/**
 * Remove a slide from a deck
 * @param {Object} deck - The slide deck
 * @param {number} position - The position of the slide to remove
 * @returns {Object} The updated deck
 */
function removeSlide(deck, position) {
  if (!deck.slides || position < 0 || position >= deck.slides.length) {
    return deck;
  }
  
  deck.slides.splice(position, 1);
  return deck;
}

/**
 * Update a slide in a deck
 * @param {Object} deck - The slide deck
 * @param {number} position - The position of the slide to update
 * @param {Object} slideUpdates - The updates to apply to the slide
 * @returns {Object} The updated deck
 */
function updateSlide(deck, position, slideUpdates) {
  if (!deck.slides || position < 0 || position >= deck.slides.length) {
    return deck;
  }
  
  deck.slides[position] = {
    ...deck.slides[position],
    ...slideUpdates
  };
  
  return deck;
}

/**
 * Create a new slide object
 * @param {string} type - The slide type
 * @param {string} title - The slide title
 * @param {Object} options - Additional slide properties
 * @returns {Object} The slide object
 */
function createSlide(type, title, options = {}) {
  const baseSlide = {
    title,
    type
  };
  
  return {
    ...baseSlide,
    ...options
  };
}

/**
 * Apply feedback suggestions to a slide deck
 * @param {Object} deck - The slide deck
 * @param {Object} feedback - The feedback object
 * @returns {Object} The updated deck
 */
function applyFeedback(deck, feedback) {
  if (!feedback || !feedback.slide_feedback || !Array.isArray(feedback.slide_feedback)) {
    return deck;
  }
  
  feedback.slide_feedback.forEach(slideFeedback => {
    const slideIndex = slideFeedback.slide_index;
    const revisions = slideFeedback.suggested_revisions;
    
    if (revisions && deck.slides[slideIndex]) {
      // Apply revisions where they exist and aren't null
      Object.keys(revisions).forEach(key => {
        if (revisions[key] !== null) {
          deck.slides[slideIndex][key] = revisions[key];
        }
      });
    }
  });
  
  return deck;
}

/**
 * Export the slide deck to a different format
 * @param {Object} deck - The slide deck
 * @param {string} format - The export format (json, html, md)
 * @returns {string} The exported content
 */
function exportDeck(deck, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(deck, null, 2);
      
    case 'md':
    case 'markdown':
      return exportToMarkdown(deck);
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export the slide deck to Markdown
 * @param {Object} deck - The slide deck
 * @returns {string} The Markdown content
 */
function exportToMarkdown(deck) {
  let md = `# ${deck.title}\n\n`;
  
  if (deck.description) {
    md += `${deck.description}\n\n`;
  }
  
  deck.slides.forEach((slide, index) => {
    md += `## Slide ${index + 1}: ${slide.title}\n\n`;
    
    if (slide.subtitle) {
      md += `### ${slide.subtitle}\n\n`;
    }
    
    if (slide.bullets && Array.isArray(slide.bullets)) {
      slide.bullets.forEach(bullet => {
        md += `* ${bullet}\n`;
      });
      md += '\n';
    }
    
    if (slide.content) {
      md += `${slide.content}\n\n`;
    }
    
    if (slide.image_prompt) {
      md += `> Image: ${slide.image_prompt}\n\n`;
    }
    
    if (slide.notes) {
      md += `*Speaker notes: ${slide.notes}*\n\n`;
    }
    
    md += '---\n\n';
  });
  
  return md;
}

module.exports = {
  loadSlideDeck,
  saveSlideDeck,
  createEmptySlideDeck,
  addSlide,
  removeSlide,
  updateSlide,
  createSlide,
  applyFeedback,
  exportDeck
};