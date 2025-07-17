import React from 'react'
import { Task } from '../types/index'
import { useLanguage } from '../contexts/LanguageContext'

interface TaskStatsProps {
  tasks: Task[]
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const { t } = useLanguage()
  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    requested: tasks.filter(t => t.status === 'requested').length,
    working: tasks.filter(t => t.status === 'working').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length,
  }

  const statsItems = [
    { label: t('task.pending'), value: stats.pending, color: 'bg-gray-500' },
    { label: t('task.requested'), value: stats.requested, color: 'bg-blue-500' },
    { label: t('task.working'), value: stats.working, color: 'bg-yellow-500' },
    { label: t('task.review'), value: stats.review, color: 'bg-purple-500' },
    { label: t('task.completed'), value: stats.completed, color: 'bg-green-500' },
    { label: t('stats.total'), value: stats.total, color: 'bg-gray-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsItems.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}