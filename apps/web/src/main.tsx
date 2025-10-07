if (typeof window !== "undefined") { (window as any).process = (window as any).process || { env: {} }; }
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Check if we should use Scout v7 (via URL parameter or environment)
const searchParams = new URLSearchParams(window.location.search);
const useV7 = searchParams.get('v7') === 'true' || 
             window.location.pathname.startsWith('/v7') ||
             import.meta.env.VITE_SCOUT_VERSION === '7';

// Dynamically import the appropriate App component
const AppComponent = useV7 
  ? React.lazy(() => import('./App.v7'))
  : React.lazy(() => import('./App'));

// Add version indicator to the page title
document.title = useV7 ? 'Scout Dashboard v7' : 'Scout Dashboard v5';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Scout Dashboard {useV7 ? 'v7' : 'v5'}...</p>
          </div>
        </div>
      }
    >
      <AppComponent />
    </React.Suspense>
  </React.StrictMode>,
)
