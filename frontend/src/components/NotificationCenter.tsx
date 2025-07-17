import React from 'react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../contexts/NotificationContext'
import { useLanguage } from '../contexts/LanguageContext'
import { formatRelativeTime } from '../utils/dateUtils'

interface NotificationCenterProps {
  onClose: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { t, language } = useLanguage()

  const handleNotificationClick = async (notification: any) => {
    // Delete notification from list when clicked
    await deleteNotification(notification.id)
    
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  return (
    <div className="fixed right-0 top-16 w-96 h-[600px] bg-white dark:bg-gray-800 shadow-xl border-l border-border z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">{t('notifications.title')} ({notifications.filter(n => !n.is_read).length})</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
{t('notifications.empty')}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            <SparklesIcon className="w-3 h-3" />
                            {t('notification.new')}
                          </span>
                        </div>
                      )}
                      <p className="font-medium text-sm">{notification.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.filter(n => !n.is_read).length > 0 && (
        <div className="p-4 border-t border-border">
          <button
            onClick={markAllAsRead}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
{t('notifications.mark.all.read')}
          </button>
        </div>
      )}
    </div>
  )
}