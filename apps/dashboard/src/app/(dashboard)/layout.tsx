'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    // Handle sidebar width for responsive layout
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarWidth(0)
      } else {
        // Check if sidebar is collapsed from localStorage
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true'
        setSidebarWidth(isCollapsed ? 80 : 280)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    // Listen for sidebar toggle events
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarWidth(e.detail.collapsed ? 80 : 280)
    }
    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle as any)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle as any)
    }
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tbwa-yellow"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-tbwa-gray-50 dark:bg-tbwa-gray-900">
      <Sidebar />
      
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <TopNav />
        
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
        
        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-tbwa-gray-800 border-t border-tbwa-gray-200 dark:border-tbwa-gray-700 px-4 py-2">
          <div className="flex justify-around">
            <button className="flex flex-col items-center gap-1 p-2 text-tbwa-gray-600 dark:text-tbwa-gray-400">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-tbwa-gray-600 dark:text-tbwa-gray-400">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">Expenses</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-tbwa-yellow">
              <FileText className="w-5 h-5" />
              <span className="text-xs">Tickets</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-tbwa-gray-600 dark:text-tbwa-gray-400">
              <Brain className="w-5 h-5" />
              <span className="text-xs">AI</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-tbwa-gray-600 dark:text-tbwa-gray-400">
              <User className="w-5 h-5" />
              <span className="text-xs">Me</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

// Import icons
import { Home, DollarSign, FileText, Brain, User } from 'lucide-react'