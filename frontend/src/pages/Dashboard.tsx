import React, { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import KanbanBoard from '../components/KanbanBoard'
import CreateTaskModal from '../components/CreateTaskModal'
import TaskStats from '../components/TaskStats'
import ClaudeCodeStatus from '../components/ClaudeCodeStatus'
import BackendStatus from '../components/BackendStatus'
import PermissionStatus from '../components/PermissionStatus'
import { Task, CreateTaskDto } from '../types/index'
import { taskApi, attachmentApi } from '../services/api'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { debugLog, debugError } from '../utils/debug'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { addEventListener, removeEventListener } = useWebSocket()
  const { t } = useLanguage()

  const loadTasks = async () => {
    debugLog('Loading tasks...')
    try {
      const data = await taskApi.getAll()
      debugLog('Tasks loaded successfully:', data)
      setTasks(data)
    } catch (error) {
      debugError('Failed to load tasks:', error)
      toast.error(t('message.error.load'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    const handleTaskUpdate = (data: any) => {
      // Only reload if this is the active page
      if (window.location.pathname === '/') {
        loadTasks()
      }
    }

    const handleQueueUpdate = (data: any) => {
      // Only reload if this is the active page
      if (window.location.pathname === '/') {
        loadTasks()
      }
    }

    addEventListener('task_update', handleTaskUpdate)
    addEventListener('queue_update', handleQueueUpdate)

    return () => {
      removeEventListener('task_update', handleTaskUpdate)
      removeEventListener('queue_update', handleQueueUpdate)
    }
  }, [addEventListener, removeEventListener, loadTasks])

  const handleCreateTask = async (taskData: CreateTaskDto, attachments: File[]) => {
    debugLog('Creating task with data:', taskData)
    
    try {
      const newTask = await taskApi.create(taskData)
      debugLog('Task created successfully:', newTask)
      
      // Upload attachments if any
      if (attachments.length > 0) {
        debugLog('Uploading attachments:', attachments.map(f => f.name))
        for (const file of attachments) {
          try {
            await attachmentApi.upload(newTask.id, file)
          } catch (error) {
            debugError('Failed to upload attachment:', error)
            toast.error(t('attachment.upload.failed'))
          }
        }
      }
      
      setTasks([...tasks, newTask])
      toast.success(t('message.created'))
      setShowCreateModal(false)
    } catch (error) {
      debugError('Failed to create task:', error)
      toast.error(t('message.error.save'))
      throw error // Re-throw error so CreateTaskModal can handle it
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <div className="flex flex-col gap-1">
            <ClaudeCodeStatus />
            <BackendStatus />
            <PermissionStatus />
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium text-lg"
        >
          <PlusIcon className="w-6 h-6" />
          {t('task.new')}
        </button>
      </div>

      {/* Stats */}
      <TaskStats tasks={tasks} />

      {/* Kanban Board */}
      <KanbanBoard tasks={tasks} onTasksChange={setTasks} />

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  )
}