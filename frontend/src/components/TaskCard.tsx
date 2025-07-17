import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, ArrowPathIcon, SparklesIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { Task } from '../types/index'
import { useLanguage } from '../contexts/LanguageContext'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { formatDate } from '../utils/dateUtils'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const { t, language } = useLanguage()
  const [hideNewBadge, setHideNewBadge] = React.useState(false)

  React.useEffect(() => {
    // Check localStorage to see if this task has been viewed
    const viewedTasks = JSON.parse(localStorage.getItem('viewedTasks') || '[]')
    if (viewedTasks.includes(task.id)) {
      setHideNewBadge(true)
    }
  }, [task.id])

  const isNewTask = () => {
    if (hideNewBadge) return false
    const now = new Date()
    const createdAt = new Date(task.created_at)
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 24 // 24時間以内なら新しいタスク
  }

  const isRecentlyUpdated = () => {
    if (hideNewBadge) return false
    const now = new Date()
    const updatedAt = new Date(task.updated_at)
    const createdAt = new Date(task.created_at)
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
    // 作成日と更新日が異なる（更新されている）かつ24時間以内
    return hoursDiff <= 24 && updatedAt.getTime() !== createdAt.getTime()
  }

  const getNewBadgeStyle = () => {
    if (isNewTask()) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500'
    } else if (isRecentlyUpdated()) {
      return 'bg-gradient-to-r from-blue-500 to-purple-500'
    }
    return ''
  }

  const getBadgeLabel = () => {
    if (isNewTask()) {
      return t('notification.new')
    } else if (isRecentlyUpdated()) {
      return t('notification.updated')
    }
    return ''
  }

  const getPriorityClass = () => {
    switch (task.priority) {
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  const getDueDateColor = () => {
    if (!task.due_date) return ''
    
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600'
    if (diffDays <= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div
      className={clsx(
        'task-card',
        getPriorityClass()
      )}
    >
      <Link to={`/tasks/${task.id}`} className="block">
          <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {(isNewTask() || isRecentlyUpdated()) && (
                <span className={`flex items-center gap-1 ${getNewBadgeStyle()} text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0`}>
                  <SparklesIcon className="w-2.5 h-2.5" />
                  {getBadgeLabel()}
                </span>
              )}
              <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {task.due_date && (
              <div className={clsx('flex items-center gap-1', getDueDateColor())}>
                <CalendarIcon className="w-3 h-3" />
                <span>
                  {t('task.due')}: {formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: language === 'ja' ? ja : enUS })}
                </span>
              </div>
            )}

            {task.estimated_hours && (
              <div className="flex items-center gap-1 text-gray-600">
                <ClockIcon className="w-3 h-3" />
                <span>{task.estimated_hours}{t('time.hours')}</span>
              </div>
            )}

            {task.version > 1 && (
              <div className="flex items-center gap-1 text-purple-600">
                <ArrowPathIcon className="w-3 h-3" />
                <span>{t('task.rework')} (v{task.version})</span>
              </div>
            )}

            {(task.attachment_count || 0) > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <PaperClipIcon className="w-3 h-3" />
                <span>{task.attachment_count}</span>
              </div>
            )}
          </div>


          <div className="text-xs text-gray-500">
            {t('task.created')}: {task.created_at ? formatDate(task.created_at, language) : t('unknown')}
          </div>
        </div>
        </Link>
    </div>
  )
}