'use client'

import { Search, Bell, Sun, Moon, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New expense submitted',
      description: 'John Doe submitted $450 for approval',
      time: '5m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Ticket resolved',
      description: 'IT-2023 has been resolved',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Policy update',
      description: 'Travel expense policy has been updated',
      time: '2h ago',
      unread: false,
    },
  ]

  return (
    <header className="bg-white dark:bg-tbwa-gray-800 border-b border-tbwa-gray-200 dark:border-tbwa-gray-700 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbwa-gray-400" />
            <input
              type="search"
              placeholder="Search expenses, tickets, employees..."
              className="form-input pl-10 pr-4 w-full"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 ml-4">
          {/* Date/Time */}
          <div className="hidden lg:block text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400">
            {format(currentTime, 'EEE, MMM d, yyyy • h:mm a')}
          </div>

          {/* AI Assistant */}
          <div className="relative">
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="p-2 hover:bg-tbwa-gray-100 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors"
              aria-label="AI Assistant"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showAIAssistant && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-tbwa-gray-800 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700 p-4 z-50"
                >
                  <h3 className="font-semibold mb-3">AI Assistant</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 hover:bg-tbwa-gray-50 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors">
                      <p className="font-medium">Ask Maya</p>
                      <p className="text-sm text-tbwa-gray-500">Get help with documentation</p>
                    </button>
                    <button className="w-full text-left p-3 hover:bg-tbwa-gray-50 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors">
                      <p className="font-medium">Talk to LearnBot</p>
                      <p className="text-sm text-tbwa-gray-500">Learn about new features</p>
                    </button>
                    <button className="w-full text-left p-3 hover:bg-tbwa-gray-50 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors">
                      <p className="font-medium">YaYo Tips</p>
                      <p className="text-sm text-tbwa-gray-500">Get UI/UX suggestions</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-tbwa-gray-100 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-tbwa-yellow rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-tbwa-gray-800 rounded-lg shadow-lg border border-tbwa-gray-200 dark:border-tbwa-gray-700 z-50"
                >
                  <div className="p-4 border-b border-tbwa-gray-200 dark:border-tbwa-gray-700">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-tbwa-gray-100 dark:border-tbwa-gray-700 hover:bg-tbwa-gray-50 dark:hover:bg-tbwa-gray-700 cursor-pointer',
                          notification.unread && 'bg-tbwa-yellow/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <div className="w-2 h-2 bg-tbwa-yellow rounded-full mt-2"></div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400">
                              {notification.description}
                            </p>
                            <p className="text-xs text-tbwa-gray-500 dark:text-tbwa-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <button className="text-sm text-tbwa-yellow hover:text-tbwa-yellow-dark font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-tbwa-gray-100 dark:hover:bg-tbwa-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}