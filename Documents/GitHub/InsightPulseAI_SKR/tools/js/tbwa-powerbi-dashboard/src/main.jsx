import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import Power BI JavaScript SDK script dynamically
const loadPowerBISDK = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/powerbi-client@2.18.6/dist/powerbi.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = (error) => reject(new Error(`Failed to load Power BI SDK: ${error}`))
    document.head.appendChild(script)
  })
}

// Initialize application
const initializeApp = async () => {
  try {
    // Try to load Power BI SDK
    await loadPowerBISDK()
    console.log('Power BI SDK loaded successfully')
  } catch (error) {
    console.warn('Power BI SDK could not be loaded:', error)
    console.log('Continuing without Power BI SDK support')
  }
  
  // Render React application
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// Start initialization
initializeApp()