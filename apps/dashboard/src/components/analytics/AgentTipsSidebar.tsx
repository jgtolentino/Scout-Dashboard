'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Sparkles, BookOpen, Palette, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AgentTip {
  id: string
  agent: 'maya' | 'learnbot' | 'yayo'
  title: string
  description: string
  icon: React.ReactNode
  color: string
  action?: {
    label: string
    onClick: () => void
  }
}

const AGENT_CONFIGS = {
  maya: {
    name: 'Maya',
    role: 'Documentation Assistant',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    avatar: '🤖'
  },
  learnbot: {
    name: 'LearnBot',
    role: 'Learning & Training',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    avatar: '🎓'
  },
  yayo: {
    name: 'YaYo',
    role: 'UX/UI Advisor',
    icon: <Palette className="w-5 h-5" />,
    color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20',
    avatar: '🎨'
  }
}

export function AgentTipsSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTips, setActiveTips] = useState<AgentTip[]>([])
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Generate contextual tips based on current page/data
    const tips: AgentTip[] = [
      {
        id: 'maya-expense-tip',
        agent: 'maya',
        title: 'Expense Documentation',
        description: 'Did you know? You can export expense reports directly to PDF with custom branding.',
        icon: AGENT_CONFIGS.maya.icon,
        color: AGENT_CONFIGS.maya.color,
        action: {
          label: 'Learn More',
          onClick: () => console.log('Open documentation')
        }
      },
      {
        id: 'learnbot-approval-tip',
        agent: 'learnbot',
        title: 'Approval Best Practices',
        description: 'Your average approval time is 18 hours. Learn how to reduce it to under 8 hours.',
        icon: AGENT_CONFIGS.learnbot.icon,
        color: AGENT_CONFIGS.learnbot.color,
        action: {
          label: 'Take Training',
          onClick: () => console.log('Start training module')
        }
      },
      {
        id: 'yayo-dashboard-tip',
        agent: 'yayo',
        title: 'Customize Your Dashboard',
        description: 'Drag and drop widgets to create your perfect dashboard layout.',
        icon: AGENT_CONFIGS.yayo.icon,
        color: AGENT_CONFIGS.yayo.color,
        action: {
          label: 'Customize',
          onClick: () => console.log('Open customization panel')
        }
      }
    ]

    // Filter out dismissed tips
    setActiveTips(tips.filter(tip => !dismissedTips.has(tip.id)))
  }, [dismissedTips])

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => new Set(prev).add(tipId))
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-30',
          'bg-tbwa-yellow hover:bg-tbwa-yellow-dark',
          'flex items-center justify-center',
          'transition-all duration-200',
          isOpen && 'opacity-0 pointer-events-none'
        )}
      >
        <MessageSquare className="w-6 h-6 text-black" />
        {activeTips.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-tbwa-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">AI Assistant Tips</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your AI agents have suggestions to improve your workflow
                </p>
              </div>

              {/* Tips list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeTips.length > 0 ? (
                  activeTips.map((tip) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
                    >
                      {/* Agent header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{AGENT_CONFIGS[tip.agent].avatar}</span>
                          <div>
                            <p className="font-medium">{AGENT_CONFIGS[tip.agent].name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {AGENT_CONFIGS[tip.agent].role}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissTip(tip.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tip content */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          {tip.icon}
                          {tip.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tip.description}
                        </p>
                      </div>

                      {/* Action button */}
                      {tip.action && (
                        <button
                          onClick={tip.action.onClick}
                          className={cn(
                            'w-full px-4 py-2 rounded-lg text-sm font-medium',
                            'flex items-center justify-center gap-2',
                            'transition-colors',
                            tip.color
                          )}
                        >
                          {tip.action.label}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No new tips at the moment</p>
                    <p className="text-sm mt-2">Check back later for AI-powered insights</p>
                  </div>
                )}
              </div>

              {/* Agent selector */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Chat with an agent:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(AGENT_CONFIGS).map(([key, agent]) => (
                    <button
                      key={key}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-2xl">{agent.avatar}</span>
                      <span className="text-xs font-medium">{agent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}