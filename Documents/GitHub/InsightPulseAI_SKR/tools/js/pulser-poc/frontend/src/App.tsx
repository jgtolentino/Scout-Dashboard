import { useState } from 'react';
import TransactionDashboard from './TransactionDashboard';
import BrandsDashboard from './BrandsDashboard';

function App() {
  const [activeView, setActiveView] = useState<'transactions' | 'brands'>('brands');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('brands')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition ${
                activeView === 'brands'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Brand Performance
            </button>
            <button
              onClick={() => setActiveView('transactions')}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition ${
                activeView === 'transactions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transaction Trends
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeView === 'brands' ? <BrandsDashboard /> : <TransactionDashboard />}
    </div>
  );
}

export default App;