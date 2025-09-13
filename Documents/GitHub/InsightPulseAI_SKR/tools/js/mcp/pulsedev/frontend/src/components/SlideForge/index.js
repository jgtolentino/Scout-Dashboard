/**
 * SlideForge Component Library
 * 
 * A collection of components for creating and displaying slide decks
 * with server-side rendering support.
 */

import SlideViewerSSR from './SlideViewerSSR';
import SlideForgeDemo from './SlideForgeDemo';
import * as slideDeckUtils from './slideDeckUtils';

export {
  SlideViewerSSR,
  SlideForgeDemo,
  slideDeckUtils
};

export default {
  SlideViewerSSR,
  SlideForgeDemo,
  ...slideDeckUtils
};