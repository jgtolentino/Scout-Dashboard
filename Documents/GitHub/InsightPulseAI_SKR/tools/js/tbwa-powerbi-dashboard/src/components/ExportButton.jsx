import { useState, useRef, useEffect } from 'react'
import { useDataStore } from '../store/dataStore'

function ExportButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { exportData } = useDataStore()
  const menuRef = useRef(null)

  // Close menu when clicking outside
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false)
    }
  }

  // Add/remove event listener
  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])
  
  // Toast timeout effect
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showToast])
  
  // Function to show toast notifications
  const showToastNotification = (message) => {
    setToastMessage(message)
    setShowToast(true)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="btn-outline flex items-center gap-1"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
          <button 
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
            onClick={() => {
              exportData('csv')
              setIsMenuOpen(false)
              showToastNotification('CSV export complete')
            }}
          >
            Export as CSV
          </button>
          <button 
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              exportData('json')
              setIsMenuOpen(false)
              showToastNotification('JSON export complete')
            }}
          >
            Export as JSON
          </button>
          <button 
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              exportData('excel')
              setIsMenuOpen(false)
              showToastNotification('Excel export complete')
            }}
          >
            Export as Excel
          </button>
        </div>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default ExportButton
