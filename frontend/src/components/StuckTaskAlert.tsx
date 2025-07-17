import React, { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'
import { useSystemStatus } from '../contexts/SystemStatusContext'
import { stuckTaskApi } from '../services/stuck-task-api'
import toast from 'react-hot-toast'

interface StuckTask {
  id: string
  task_id: string
  title: string
  priority: string
  minutes_stuck: number
  started_at: string
}

export default function StuckTaskAlert() {
  const [stuckTasks, setStuckTasks] = useState<StuckTask[]>([])
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const { isOnline } = useSystemStatus()

  useEffect(() => {
    checkStuckTasks()
    const interval = setInterval(checkStuckTasks, 2 * 60 * 1000) // Check every 2 minutes
    return () => clearInterval(interval)
  }, [isOnline])

  const checkStuckTasks = async () => {
    // Only check for stuck tasks when system is online
    if (!isOnline) {
      setStuckTasks([])
      return
    }
    
    try {
      const data = await stuckTaskApi.getStuckTasks()
      setStuckTasks(data)
    } catch (error) {
      console.error('Failed to check stuck tasks:', error)
    }
  }

  const handleRestart = async (taskId: string) => {
    setLoading(true)
    try {
      await stuckTaskApi.restartTask(taskId)
      toast.success(t('stuck.task.restarted'))
      await checkStuckTasks()
    } catch (error) {
      console.error('Failed to restart task:', error)
      toast.error(t('stuck.task.restart.failed'))
    } finally {
      setLoading(false)
    }
  }

  if (stuckTasks.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      {stuckTasks.map((task) => (
        <div
          key={task.id}
          className="mb-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg animate-pulse"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                {t('stuck.task.detected')}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {task.title}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {Math.round(task.minutes_stuck)} {t('stuck.task.minutes')}
              </p>
              <button
                onClick={() => handleRestart(task.task_id)}
                disabled={loading}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {t('stuck.task.restart')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}