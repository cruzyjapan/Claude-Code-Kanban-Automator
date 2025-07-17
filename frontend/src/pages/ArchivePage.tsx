import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArchiveBoxIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Task } from '../types/index'
import { taskApi } from '../services/api'
import { formatDate } from '../utils/dateUtils'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'

export default function ArchivePage() {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useLanguage()

  useEffect(() => {
    loadArchivedTasks()
  }, [])

  const loadArchivedTasks = async () => {
    try {
      const tasks = await taskApi.getArchived()
      setArchivedTasks(tasks)
    } catch (error) {
      toast.error(t('message.error.load'))
      console.error('Failed to load archived tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermanentDelete = async (task: Task) => {
    if (window.confirm(`"${task.title}"\n${t('archive.confirm.delete')}`)) {
      try {
        await taskApi.permanentlyDelete(task.id)
        toast.success(t('message.deleted'))
        await loadArchivedTasks()
      } catch (error: any) {
        console.error('Failed to delete task:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || t('message.error.delete')
        toast.error(errorMessage)
      }
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; class: string }> = {
      high: { label: t('task.priority.high'), class: 'bg-red-100 text-red-800' },
      medium: { label: t('task.priority.medium'), class: 'bg-yellow-100 text-yellow-800' },
      low: { label: t('task.priority.low'), class: 'bg-green-100 text-green-800' },
    }
    const p = priorityMap[priority] || priorityMap.medium
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.class}`}>
        {p.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArchiveBoxIcon className="w-8 h-8" />
{t('archive.title')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
{t('archive.description')}
        </p>
      </div>

      {archivedTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <ArchiveBoxIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">{t('archive.empty')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
{t('task.title')}
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
{t('task.priority')}
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
{t('task.created')}
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
{t('archive.date')}
                </th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
{t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {archivedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(task.priority)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(task.created_at, language)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(task.updated_at, language)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePermanentDelete(task)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
{t('archive.delete.permanent')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}