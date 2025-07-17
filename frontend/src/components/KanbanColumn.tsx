import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  children: React.ReactNode
}

export default function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { t } = useLanguage()
  const showScrollHint = count > 10

  // Define background colors for each status
  const statusColors = {
    pending: 'bg-slate-50 dark:bg-slate-900/30',
    requested: 'bg-blue-50 dark:bg-blue-900/20',
    working: 'bg-yellow-50 dark:bg-yellow-900/20',
    review: 'bg-purple-50 dark:bg-purple-900/20',
    completed: 'bg-green-50 dark:bg-green-900/20'
  }

  const columnBgColor = statusColors[id as keyof typeof statusColors] || ''

  return (
    <div className={`kanban-column h-full flex flex-col p-3 rounded-lg ${columnBgColor} transition-colors`}>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded-full">
            {count}
          </span>
          {showScrollHint && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <ChevronDownIcon className="w-3 h-3 animate-bounce" />
              <span className="ml-1">{t('scroll')}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 kanban-scrollable">
        {children}
      </div>
    </div>
  )
}