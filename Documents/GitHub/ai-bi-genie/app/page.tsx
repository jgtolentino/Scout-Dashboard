'use client'

import { useState } from 'react'
import AskCESDemo from '../components/AskCES'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">🎯</span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="ces-heading-xl ces-text-gradient mb-6">
              Ask CES
            </h1>
            
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Centralized Enterprise System
            </p>
            
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Central Intelligence for Enterprise Success - Transform your business decisions with AI-powered insights through natural language queries
            </p>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="ces-card text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-xl">🔍</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Query Engine</h3>
                <p className="text-sm text-gray-600">Ask questions in natural language</p>
              </div>

              <div className="ces-card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-xl">💡</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Insights Hub</h3>
                <p className="text-sm text-gray-600">AI-powered recommendations</p>
              </div>

              <div className="ces-card text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pulse Monitor</h3>
                <p className="text-sm text-gray-600">Real-time business metrics</p>
              </div>

              <div className="ces-card text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 text-xl">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Strategy Center</h3>
                <p className="text-sm text-gray-600">Strategic planning & scenarios</p>
              </div>
            </div>

            {/* Demo Section */}
            <div className="max-w-4xl mx-auto">
              <h2 className="ces-heading-md text-gray-900 mb-8">
                Experience Ask CES
              </h2>
              
              <AskCESDemo />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
              <span className="text-xl font-bold">Ask CES</span>
            </div>
            <p className="text-gray-400 mb-4">
              Central Intelligence for Enterprise Success
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>v3.0.0</span>
              <span>•</span>
              <span>Powered by AI</span>
              <span>•</span>
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}