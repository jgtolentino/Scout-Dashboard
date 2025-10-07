/**
 * SlideForge Server-Side Rendering Helper
 * 
 * Provides utilities for server-side rendering of slide decks
 * with frameworks like Next.js, Remix, or custom Node.js servers.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import SlideViewerSSR from './SlideViewerSSR';
import { validateSlideDeck } from './slideDeckUtils';

/**
 * Render Slide Deck to HTML
 * 
 * Server-side renders a slide deck to HTML string
 * 
 * @param {Object} slideDeck The slide deck to render
 * @param {Object} options Rendering options
 * @param {string} options.theme Theme name
 * @param {boolean} options.showControls Whether to show navigation controls
 * @returns {string} HTML string of the rendered slide deck
 */
export const renderSlideDeckToHTML = (slideDeck, options = {}) => {
  if (!validateSlideDeck(slideDeck)) {
    throw new Error('Invalid slide deck format');
  }
  
  const { theme = 'default', showControls = true } = options;
  
  const html = renderToString(
    <SlideViewerSSR
      slideDeck={slideDeck}
      theme={theme}
      showControls={showControls}
    />
  );
  
  return html;
};

/**
 * Get Slide Deck Metadata
 * 
 * Extracts metadata from a slide deck for SEO and previews
 * 
 * @param {Object} slideDeck The slide deck
 * @returns {Object} Metadata object with title, description, etc.
 */
export const getSlideDeckMetadata = (slideDeck) => {
  if (!validateSlideDeck(slideDeck)) {
    throw new Error('Invalid slide deck format');
  }
  
  return {
    title: slideDeck.title,
    description: slideDeck.description || '',
    author: slideDeck.author || '',
    createdAt: slideDeck.createdAt,
    lastModified: slideDeck.lastModified,
    slideCount: slideDeck.slides.length
  };
};

/**
 * Generate Slide Deck Static Props
 * 
 * Helper for frameworks with static/server props (Next.js, etc.)
 * 
 * @param {Object} slideDeck The slide deck
 * @returns {Object} Props object for static generation
 */
export const generateSlideDeckStaticProps = (slideDeck) => {
  if (!validateSlideDeck(slideDeck)) {
    throw new Error('Invalid slide deck format');
  }
  
  return {
    props: {
      slideDeck,
      metadata: getSlideDeckMetadata(slideDeck)
    }
  };
};

/**
 * Generate Open Graph Tags
 * 
 * Creates Open Graph metadata tags for social sharing
 * 
 * @param {Object} slideDeck The slide deck
 * @param {string} url The URL where the slide deck will be hosted
 * @returns {Object} Object with og tags as properties
 */
export const generateOpenGraphTags = (slideDeck, url) => {
  if (!validateSlideDeck(slideDeck)) {
    throw new Error('Invalid slide deck format');
  }
  
  return {
    'og:title': slideDeck.title,
    'og:description': slideDeck.description || `Slide deck with ${slideDeck.slides.length} slides`,
    'og:type': 'website',
    'og:url': url,
    'og:site_name': 'SlideForge Presentations',
    'twitter:card': 'summary_large_image',
    'twitter:title': slideDeck.title,
    'twitter:description': slideDeck.description || `Slide deck with ${slideDeck.slides.length} slides`
  };
};

/**
 * SlideForge Express Middleware
 * 
 * Creates Express middleware for serving slide decks
 * 
 * @param {Function} getSlideDeck Function to retrieve a slide deck by ID
 * @returns {Function} Express middleware function
 */
export const slideForgeSsrMiddleware = (getSlideDeck) => {
  return async (req, res, next) => {
    try {
      // Extract slide deck ID from URL parameter
      const slideId = req.params.id;
      
      if (!slideId) {
        return next();
      }
      
      // Get slide deck data
      const slideDeck = await getSlideDeck(slideId);
      
      if (!slideDeck) {
        return res.status(404).send('Slide deck not found');
      }
      
      // Extract theme from query parameters or use default
      const theme = req.query.theme || 'default';
      const showControls = req.query.controls !== 'false';
      
      // Render the slide deck to HTML
      const html = renderSlideDeckToHTML(slideDeck, { theme, showControls });
      
      // Get metadata for head tags
      const metadata = getSlideDeckMetadata(slideDeck);
      
      // Send the full HTML response
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${metadata.title}</title>
          <meta name="description" content="${metadata.description}">
          <meta name="author" content="${metadata.author}">
          <style>
            ${require('./SlideViewerSSR.css').default}
          </style>
        </head>
        <body>
          <div id="root">${html}</div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  };
};

export default {
  renderSlideDeckToHTML,
  getSlideDeckMetadata,
  generateSlideDeckStaticProps,
  generateOpenGraphTags,
  slideForgeSsrMiddleware
};