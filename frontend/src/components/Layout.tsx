import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BellIcon, SunIcon, MoonIcon, Cog6ToothIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationContext'
import NotificationCenter from './NotificationCenter'
import StuckTaskAlert from './StuckTaskAlert'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = React.useState(false)

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('auto')
    else setTheme('light')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex flex-col">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  AI Tasks, Done Right
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 group"
                title={theme === 'auto' ? 'Auto theme' : theme === 'light' ? 'Light theme' : 'Dark theme'}
              >
                {theme === 'auto' ? (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-gray-600 group-hover:shadow-lg transition-shadow" />
                ) : theme === 'light' ? (
                  <SunIcon className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-500 transition-colors" />
                )}
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 group"
              >
                <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Archive */}
              <Link
                to="/archive"
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 group ${
                  location.pathname === '/archive' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' 
                    : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
                title="アーカイブ"
              >
                <ArchiveBoxIcon className={`w-5 h-5 transition-colors ${
                  location.pathname === '/archive'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                }`} />
              </Link>

              {/* Settings */}
              <Link
                to="/settings"
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 group ${
                  location.pathname === '/settings' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                    : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Cog6ToothIcon className={`w-5 h-5 transition-colors ${
                  location.pathname === '/settings'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent dark:via-gray-900/20 pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="backdrop-blur-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-white/20 dark:border-gray-700/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <a 
              href="https://cruzy.jp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Copyright © Cruzy Japan | クルージジャパン株式会社 All Rights Reserved.
            </a>
          </div>
        </div>
      </footer>

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
      
      {/* Stuck Task Alert */}
      <StuckTaskAlert />
    </div>
  )
}