/**
 * index.js
 * 
 * Entry point for the Prompt Lab web application.
 * Renders the main App component into the DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);