'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Home,
  DollarSign,
  CreditCard,
  FileText,
  Users,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  HelpCircle,
} from 'lucide-react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: DollarSign,
  },
  {
    label: 'Cash Advances',
    href: '/advances',
    icon: CreditCard,
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: FileText,
    badge: 3, // Dynamic in real app
  },
  {
    label: 'HRIS',
    href: '/hris',
    icon: Users,
  },
  {
    label: 'AI Insights',
    href: '/ai-insights',
    icon: Brain,
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: Settings,
    roles: ['admin', 'manager'],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const user = useUser()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-tbwa-gray-200 dark:border-tbwa-gray-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tbwa-yellow rounded-lg flex items-center justify-center">
            <span className="text-tbwa-black font-bold text-xl">T</span>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-tbwa-black dark:text-white">
              TBWA Analytics
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // Role-based visibility
            if (item.roles && !item.roles.includes(user?.user_metadata?.role || 'employee')) {
              return null
            }

            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'sidebar-link',
                    isActive && 'sidebar-link active',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-tbwa-yellow text-tbwa-black text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-tbwa-gray-200 dark:border-tbwa-gray-700">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="w-10 h-10 bg-tbwa-gray-200 dark:bg-tbwa-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-tbwa-black dark:text-white">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-tbwa-gray-500 dark:text-tbwa-gray-400">
                {user?.user_metadata?.role || 'Employee'}
              </p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="mt-4 space-y-2">
            <button
              onClick={() => router.push('/help')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400 hover:text-tbwa-black dark:hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-tbwa-gray-600 dark:text-tbwa-gray-400 hover:text-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white dark:bg-tbwa-gray-800 border border-tbwa-gray-200 dark:border-tbwa-gray-700 rounded-full p-1.5 shadow-sm hover:shadow-md transition-shadow hidden lg:block"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-tbwa-gray-800 rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-tbwa-gray-800 border-r border-tbwa-gray-200 dark:border-tbwa-gray-700 z-40"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-tbwa-gray-800 border-r border-tbwa-gray-200 dark:border-tbwa-gray-700 z-50 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}