/**
 * Slide Deck Utilities
 * 
 * Provides helper functions and types for working with slide decks
 */

/**
 * Slide Deck Schema
 * 
 * Defines the structure of a valid slide deck JSON
 */
export const slideDeckSchema = {
  title: 'Slide Deck Schema',
  type: 'object',
  required: ['title', 'slides'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    author: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    lastModified: { type: 'string', format: 'date-time' },
    slides: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['title', 'content', 'image', 'bullets', 'code', 'split', 'end']
          },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          content: { type: 'string' },
          imageUrl: { type: 'string' },
          alt: { type: 'string' },
          bullets: {
            type: 'array',
            items: { type: 'string' }
          },
          code: { type: 'string' },
          codeLanguage: { type: 'string' },
          leftContent: { type: 'string' },
          rightContent: { type: 'string' }
        }
      }
    },
    theme: { type: 'string' }
  }
};

/**
 * Create Empty Slide Deck
 * 
 * @param {string} title The title of the slide deck
 * @returns {Object} A new empty slide deck with default structure
 */
export const createEmptySlideDeck = (title = 'New Slide Deck') => {
  return {
    title,
    description: '',
    author: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    slides: [
      {
        type: 'title',
        title,
        subtitle: 'Presentation Subtitle'
      }
    ],
    theme: 'default'
  };
};

/**
 * Add Slide to Deck
 * 
 * @param {Object} slideDeck The slide deck to modify
 * @param {string} slideType The type of slide to add
 * @param {Object} slideData Additional data for the slide
 * @returns {Object} The updated slide deck
 */
export const addSlideToDeck = (slideDeck, slideType, slideData = {}) => {
  const newSlide = {
    type: slideType,
    ...slideData
  };
  
  return {
    ...slideDeck,
    slides: [...slideDeck.slides, newSlide],
    lastModified: new Date().toISOString()
  };
};

/**
 * Validate Slide Deck
 * 
 * Checks if a slide deck meets the required schema
 * 
 * @param {Object} slideDeck The slide deck to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateSlideDeck = (slideDeck) => {
  if (!slideDeck || typeof slideDeck !== 'object') return false;
  if (!slideDeck.title || typeof slideDeck.title !== 'string') return false;
  if (!slideDeck.slides || !Array.isArray(slideDeck.slides)) return false;
  
  // Check that all slides have a valid type
  const validTypes = ['title', 'content', 'image', 'bullets', 'code', 'split', 'end'];
  return slideDeck.slides.every(slide => 
    slide.type && validTypes.includes(slide.type)
  );
};

/**
 * Generate Sample Slide Deck
 * 
 * Creates a sample slide deck for testing
 * 
 * @returns {Object} A sample slide deck with various slide types
 */
export const generateSampleSlideDeck = () => {
  return {
    title: 'Introduction to SlideForge',
    description: 'Learn how to create and present slide decks with SlideForge',
    author: 'SlideForge Team',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    slides: [
      {
        type: 'title',
        title: 'Introduction to SlideForge',
        subtitle: 'Create Beautiful Presentations with SSR'
      },
      {
        type: 'content',
        title: 'What is SlideForge?',
        content: 'SlideForge is a powerful presentation tool that enables you to create beautiful, server-side rendered slide decks. With SlideForge, your presentations load instantly and work great on any device.'
      },
      {
        type: 'bullets',
        title: 'Key Features',
        bullets: [
          'Server-side rendering for optimal performance',
          'Multiple slide types for various content needs',
          'Responsive design that works on all devices',
          'Easy-to-use API for creating and editing slides',
          'Themeable presentation styles'
        ]
      },
      {
        type: 'image',
        title: 'Visual Presentations',
        imageUrl: 'https://via.placeholder.com/800x400?text=SlideForge+Demo',
        alt: 'Demo of SlideForge presentation',
        content: 'SlideForge makes it easy to include images in your presentations.'
      },
      {
        type: 'code',
        title: 'Code Example',
        code: `import { SlideViewerSSR } from 'slideforge';

// Create a new slide deck
const myDeck = createSlideDeck('My Presentation');

// Render the slide deck
const MyPresentation = () => (
  <SlideViewerSSR slideDeck={myDeck} theme="dark" />
);`,
        codeLanguage: 'javascript',
        content: 'Including code snippets is simple with the code slide type.'
      },
      {
        type: 'split',
        title: 'Side by Side Content',
        leftContent: '<h3>Left Side</h3><p>You can add content on the left side of a split slide.</p>',
        rightContent: '<h3>Right Side</h3><p>And different content on the right side.</p>'
      },
      {
        type: 'end',
        title: 'Thank You!',
        content: 'Get started with SlideForge today!'
      }
    ],
    theme: 'default'
  };
};

export default {
  createEmptySlideDeck,
  addSlideToDeck,
  validateSlideDeck,
  generateSampleSlideDeck,
  slideDeckSchema
};