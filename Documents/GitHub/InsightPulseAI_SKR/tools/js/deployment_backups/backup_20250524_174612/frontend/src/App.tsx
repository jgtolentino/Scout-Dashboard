/**
 * Main App Component with Routing
 * POC: Transaction Trends Route
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TransactionTrends from './pages/TransactionTrends';

// Simple navigation component
const Navigation: React.FC = () => (
  <nav className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Scout Dashboard
          </Link>
          <div className="flex space-x-4">
            <Link 
              to="/transactions" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              data-testid="nav-transactions"
            >
              Transaction Trends
            </Link>
            <span className="text-gray-400 px-3 py-2 text-sm">
              More modules coming soon...
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          POC v1.0
        </div>
      </div>
    </div>
  </nav>
);

// Home page placeholder
const HomePage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Scout Dashboard POC</h1>
      <p className="text-xl text-gray-600 mb-8">
        Transaction analytics and insights platform
      </p>
      <Link 
        to="/transactions"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        data-testid="view-transactions-button"
      >
        View Transaction Trends
        <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  </div>
);

// 404 page
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Link 
        to="/"
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Return to Home
      </Link>
    </div>
  </div>
);

// Main App component
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/transactions" element={<TransactionTrends />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;