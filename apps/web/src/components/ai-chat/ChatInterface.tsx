'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Database, MessageSquare } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatModeSelector } from './ChatModeSelector';

export function ChatInterface() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    mode,
    setMode
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Scout AI Assistant</h2>
        </div>
        <ChatModeSelector mode={mode} onChange={setMode} />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">Hi! I'm Scout AI Assistant</p>
            <p className="text-sm">
              I can help you analyze data, answer questions, and generate insights.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>Try asking:</p>
              <button
                onClick={() => sendMessage('Show me top performing brands this month')}
                className="block mx-auto text-blue-600 hover:underline"
              >
                "Show me top performing brands this month"
              </button>
              <button
                onClick={() => sendMessage('What are the sales trends by region?')}
                className="block mx-auto text-blue-600 hover:underline"
              >
                "What are the sales trends by region?"
              </button>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Scout AI is thinking...</span>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading}
      />
    </div>
  );
}