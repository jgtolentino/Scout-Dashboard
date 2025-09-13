'use client'

import React, { useState } from 'react'

export default function AskCESDemo() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confidence, setConfidence] = useState(0)

  const sampleQueries = [
    "What are our top performing products this quarter?",
    "Show me sales trends in the APAC region",
    "How did the marketing campaign affect conversion rates?", 
    "Predict Q1 revenue based on current pipeline",
    "Which channels have the highest ROI?"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setAnswer('')
    setConfidence(0)

    try {
      // Simulate API call to Ask CES
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock response based on query
      const mockResponse = generateMockResponse(query)
      setAnswer(mockResponse.answer)
      setConfidence(mockResponse.confidence)
    } catch (error) {
      setAnswer('Sorry, I encountered an error processing your request. Please try again.')
      setConfidence(0)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockResponse = (query: string) => {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('product') || queryLower.includes('perform')) {
      return {
        answer: "Based on Q4 2024 data, your top performing products are: 1) Premium Coffee Blend (₱2.1M revenue, +18% growth), 2) Organic Snack Pack (₱1.8M revenue, +24% growth), 3) Energy Drink Series (₱1.5M revenue, +12% growth). Coffee Blend shows exceptional market penetration in Metro Manila.",
        confidence: 94
      }
    } else if (queryLower.includes('sales') || queryLower.includes('trend')) {
      return {
        answer: "APAC region shows strong upward trends: Philippines +15.2%, Singapore +12.8%, Malaysia +9.4%. Key drivers include digital transformation initiatives and expanded distribution network. Recommend increasing inventory allocation to Philippines by 20%.",
        confidence: 89
      }
    } else if (queryLower.includes('campaign') || queryLower.includes('marketing')) {
      return {
        answer: "Your recent digital marketing campaign achieved 23% conversion rate improvement. Social media engagement increased 34%, with video content performing 2.3x better than static ads. Cost per acquisition decreased by ₱47. Recommend expanding video budget by 40%.",
        confidence: 91
      }
    } else if (queryLower.includes('revenue') || queryLower.includes('predict')) {
      return {
        answer: "Based on current pipeline analysis and seasonal trends, Q1 2025 revenue projection is ₱4.2M (confidence interval: ₱3.8M - ₱4.6M). Key factors: holiday season momentum (+12%), new product launches (+8%), market expansion (+5%). 78% probability of exceeding target.",
        confidence: 87
      }
    } else if (queryLower.includes('channel') || queryLower.includes('roi')) {
      return {
        answer: "Channel ROI analysis: E-commerce leads with 340% ROI, followed by Social Media (280%), Traditional Retail (185%), and Print Media (95%). E-commerce shows highest growth potential. Recommend reallocating 15% budget from Print to Digital channels.",
        confidence: 92
      }
    } else {
      return {
        answer: "I've analyzed your query and found relevant insights in our enterprise data. For more specific results, try asking about products, sales trends, marketing campaigns, revenue predictions, or channel performance. I can provide detailed analytics with confidence scores.",
        confidence: 76
      }
    }
  }

  return (
    <div className="ces-card max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-xl">🤖</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Ask CES AI</h3>
        </div>
        <p className="text-gray-600">
          Ask me anything about your business data in natural language
        </p>
      </div>

      {/* Sample Queries */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Try these sample queries:</p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sample, index) => (
            <button
              key={index}
              onClick={() => setQuery(sample)}
              className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors duration-200"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask CES: What insights would you like to explore?"
            className="ces-input flex-1"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="ces-button-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing...
              </div>
            ) : (
              '🎯 Ask CES'
            )}
          </button>
        </div>
      </form>

      {/* Response */}
      {(answer || isLoading) && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">✨</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">CES Analysis</h4>
                {confidence > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {confidence}% confidence
                  </span>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  {answer}
                </div>
              )}

              {!isLoading && answer && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">💡 Related Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                      📊 View Dashboard
                    </button>
                    <button className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                      📈 Generate Report
                    </button>
                    <button className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                      🎯 Set Alert
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}