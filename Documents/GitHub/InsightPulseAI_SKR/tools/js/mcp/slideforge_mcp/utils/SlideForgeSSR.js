/**
 * SlideForgeSSR.js
 * Helper functions for server-side rendering of slide decks with different frameworks
 */

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const fs = require('fs');
const path = require('path');

// Utils for loading slide decks
const { loadSlideDeck } = require('./slideDeckUtils');

/**
 * Render a slide deck to static HTML using React SSR
 * 
 * @param {Object} options - Rendering options
 * @param {string|Object} options.deck - Slide deck object or filename to load
 * @param {string} [options.template='default'] - Template theme to use
 * @param {boolean} [options.showNavigation=true] - Whether to show navigation controls
 * @param {number} [options.initialSlide=0] - Initial slide to display
 * @param {string} [options.slidesDir='./public/slides'] - Directory containing slide JSON files
 * @param {boolean} [options.fullPage=true] - Whether to output a complete HTML page
 * @param {Object} [options.meta={}] - Additional metadata for the page
 * @returns {string} The rendered HTML
 */
async function renderToHTML(options) {
  const {
    deck,
    template = 'default',
    showNavigation = true,
    initialSlide = 0,
    slidesDir = './public/slides',
    fullPage = true,
    meta = {}
  } = options;
  
  // Dynamically import the SlideViewerSSR component
  // This is necessary because it's a React component and may have JSX
  const SlideViewerSSR = require('../src/components/SlideViewerSSR');
  
  // Load deck if filename is provided
  let deckData = deck;
  if (typeof deck === 'string') {
    deckData = loadSlideDeck(deck, slidesDir);
  }
  
  // Create a React element with the SlideViewerSSR component
  const element = React.createElement(SlideViewerSSR, {
    deck: deckData,
    currentSlide: initialSlide,
    showNavigation,
    theme: template
  });
  
  // Render to static HTML
  const html = ReactDOMServer.renderToString(element);
  
  if (!fullPage) {
    return html;
  }
  
  // Get CSS file content
  const cssPath = path.resolve('./src/components/SlideViewerSSR.css');
  const cssContent = fs.existsSync(cssPath) 
    ? fs.readFileSync(cssPath, 'utf8') 
    : '';
  
  // Create a complete HTML document
  const pageTitle = meta.title || deckData.title || 'SlideForge Presentation';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pageTitle}</title>
      ${meta.description ? `<meta name="description" content="${meta.description}">` : ''}
      ${meta.author ? `<meta name="author" content="${meta.author}">` : ''}
      <style>
        ${cssContent}
        
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          font-family: 'Roboto', 'Segoe UI', 'Arial', sans-serif;
        }
        
        #root {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .presentation-container {
          flex: 1;
          padding: 20px;
          background-color: #f5f5f5;
        }
      </style>
    </head>
    <body>
      <div id="root">
        <div class="presentation-container">
          ${html}
        </div>
      </div>
      
      <script>
        // Simple client-side navigation
        document.addEventListener('DOMContentLoaded', () => {
          const prevButtons = document.querySelectorAll('.nav-button.prev');
          const nextButtons = document.querySelectorAll('.nav-button.next');
          
          let currentSlide = ${initialSlide};
          const slideCount = ${deckData.slides.length};
          
          // Handle navigation button clicks
          prevButtons.forEach(btn => btn.addEventListener('click', () => {
            if (currentSlide > 0) {
              currentSlide--;
              
              // In a hydrated version, this would use actual client navigation
              // For now, we'll just reload the page with a query parameter
              window.location.href = '?slide=' + currentSlide;
            }
          }));
          
          nextButtons.forEach(btn => btn.addEventListener('click', () => {
            if (currentSlide < slideCount - 1) {
              currentSlide++;
              
              // In a hydrated version, this would use actual client navigation
              // For now, we'll just reload the page with a query parameter
              window.location.href = '?slide=' + currentSlide;
            }
          }));
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Save a rendered slide deck to a file
 * 
 * @param {string} html - The rendered HTML
 * @param {string} outputPath - The output file path
 */
function saveRenderedDeck(html, outputPath) {
  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}

/**
 * Render a slide deck and save it to a file
 * 
 * @param {Object} options - Rendering options (see renderToHTML)
 * @param {string} outputPath - The output file path
 * @returns {string} The output file path
 */
async function renderAndSave(options, outputPath) {
  const html = await renderToHTML(options);
  return saveRenderedDeck(html, outputPath);
}

/**
 * Helper for Express.js integration
 * Usage: app.get('/slides/:id', slideForgeSSR.expressHandler('./public/slides'));
 * 
 * @param {string} slidesDir - Directory containing slide JSON files
 * @returns {Function} Express middleware function
 */
function expressHandler(slidesDir = './public/slides') {
  return async function(req, res) {
    try {
      const filename = req.params.id || req.query.id;
      if (!filename) {
        return res.status(400).send('Missing slide deck ID');
      }
      
      const initialSlide = parseInt(req.query.slide || '0', 10);
      const template = req.query.template || 'default';
      
      const html = await renderToHTML({
        deck: filename,
        slidesDir,
        initialSlide,
        template,
        showNavigation: true,
        fullPage: true
      });
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).send(`Error rendering slide deck: ${error.message}`);
    }
  };
}

/**
 * Helper for Next.js getServerSideProps integration
 * 
 * @param {Object} context - Next.js context object
 * @param {string} slidesDir - Directory containing slide JSON files
 * @returns {Object} Props for the page component
 */
async function getServerSideProps(context, slidesDir = './public/slides') {
  try {
    const { id, slide = '0', template = 'default' } = context.query;
    
    if (!id) {
      return {
        props: {
          error: 'Missing slide deck ID'
        }
      };
    }
    
    const initialSlide = parseInt(slide, 10);
    const deckData = loadSlideDeck(id, slidesDir);
    
    return {
      props: {
        initialDeck: deckData,
        currentSlide: initialSlide,
        template
      }
    };
  } catch (error) {
    return {
      props: {
        error: `Error loading slide deck: ${error.message}`
      }
    };
  }
}

module.exports = {
  renderToHTML,
  saveRenderedDeck,
  renderAndSave,
  expressHandler,
  getServerSideProps
};