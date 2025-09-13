import { useState } from 'react'

function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/logo.svg" 
            alt="TBWA Retail Advisor" 
            className="h-8 mr-3" 
            onError={(e) => {
              e.target.onerror = null
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZDRjAwIi8+PC9zdmc+'
            }}
          />
          <span className="font-medium text-gray-900">TBWA Retail Advisor</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <a href="/" className="text-sm font-medium text-gray-900 border-b-2 border-tbwa-yellow py-1">Dashboard</a>
          <a href="/reports" className="text-sm font-medium text-gray-500 hover:text-gray-900 py-1">Reports</a>
          <a href="/analytics" className="text-sm font-medium text-gray-500 hover:text-gray-900 py-1">Analytics</a>
          <a href="/settings" className="text-sm font-medium text-gray-500 hover:text-gray-900 py-1">Settings</a>
        </nav>

        {/* User Menu */}
        <div className="relative">
          <button 
            className="flex items-center text-sm font-medium text-gray-700 rounded-full focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              TB
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
              <a href="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
