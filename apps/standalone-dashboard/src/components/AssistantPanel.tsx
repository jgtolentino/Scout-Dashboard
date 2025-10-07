import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import useDataStore from '@/store/dataStore';

interface AssistantPanelProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
  currentView: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantPanel({ filters, currentView }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Scout Dashboard AI Assistant. I can help you analyze data, find insights, and answer questions about your retail analytics. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { datasets } = useDataStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on current view
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      if (currentView === 'transactions') {
        return `Based on the transaction trends, I can see that:
• Peak hours are typically between 6-8 PM with 920 transactions
• Daily revenue has grown by 15% over the past 30 days
• Average transaction value is ₱${Math.floor(Math.random() * 100 + 200)}
• Most transactions occur on weekends, particularly Saturdays

Would you like me to analyze a specific time period or category?`;
      }
      return 'I can analyze trends across different dimensions. Which specific trends are you interested in - transactions, products, or consumer behavior?';
    }

    if (lowerMessage.includes('top') || lowerMessage.includes('best')) {
      return `Here are the top performers based on current filters:

📊 **Top Products:**
1. Coke Mismo - 45,320 units (₱361K revenue)
2. Lucky Me Pancit Canton - 38,900 units
3. Marlboro Red - 32,100 units

🏪 **Top Categories:**
1. Beverages - 35% of transactions
2. Snacks - 28% of transactions
3. Personal Care - 18% of transactions

📍 **Top Regions:**
1. NCR - 37.6% of customers
2. Region IV-A - 20.5% of customers

What specific insights would you like to explore further?`;
    }

    if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
      return `Based on the data analysis, here are my recommendations:

💡 **Inventory Optimization:**
• Increase stock for beverages during evening hours (6-10 PM)
• Consider bundling slow-moving items with popular SKUs

📈 **Revenue Growth:**
• Target young professionals (25-34) with premium products
• Implement promotions during off-peak hours (2-5 PM)

🎯 **Customer Retention:**
• Focus on cross-category promotions (48% prefer mixed baskets)
• Leverage the 68.2% suggestion acceptance rate for alternatives

Would you like detailed strategies for any of these recommendations?`;
    }

    if (lowerMessage.includes('filter') || lowerMessage.includes('current')) {
      const activeFilters = Object.entries(filters)
        .filter(([_, value]) => value !== 'all')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return `Current active filters: ${activeFilters || 'None (showing all data)'}
      
You're viewing the ${currentView} dashboard. The data is automatically filtered based on your selections. Would you like me to analyze the filtered data or suggest different filter combinations?`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      return `I can help you with:

🔍 **Data Analysis**
• Identify trends and patterns
• Compare performance metrics
• Find anomalies or opportunities

📊 **Insights**
• Customer behavior analysis
• Product performance evaluation
• Regional comparisons

💡 **Recommendations**
• Inventory optimization
• Pricing strategies
• Marketing opportunities

Just ask me anything about your data!`;
    }

    // Default contextual response
    return `I understand you're asking about "${userMessage}". Based on the ${currentView} view, I can provide insights on transaction patterns, product performance, and customer behavior. 

Could you be more specific about what aspect you'd like me to analyze?`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const suggestedQuestions = [
    'What are the peak transaction hours?',
    'Show me top performing products',
    'Which regions have the highest growth?',
    'What are the customer demographics?',
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-500 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-dashboard-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-dashboard-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={18} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-500 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex gap-1">
                <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(question)}
                className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500 text-sm"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-dashboard-500 text-white rounded-lg hover:bg-dashboard-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}