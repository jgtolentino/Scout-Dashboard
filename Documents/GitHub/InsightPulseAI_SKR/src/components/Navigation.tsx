import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const navItems = [
  {
    "label": "Dashboard",
    "path": "/"
  },
  {
    "label": "Products",
    "path": "/product-mix"
  },
  {
    "label": "Brands",
    "path": "/brands"
  },
  {
    "label": "Consumers",
    "path": "/consumer-insights"
  },
  {
    "label": "Trends",
    "path": "/trends"
  },
  {
    "label": "Settings",
    "path": "/settings"
  }
];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex space-x-4">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="hover:bg-gray-700 px-3 py-2 rounded"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;