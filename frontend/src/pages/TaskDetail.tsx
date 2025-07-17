import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tab } from '@headlessui/react'
import { ArrowLeftIcon, PlayIcon, PauseIcon, CheckIcon, XMarkIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Task, Execution, Feedback } from '../types/index'
import { taskApi, executionApi, feedbackApi } from '../services/api'
import TaskInfo from '../components/TaskInfo'
import ExecutionLogs from '../components/ExecutionLogs'
import FeedbackSection from '../components/FeedbackSection'
import OutputFiles from '../components/OutputFiles'
import TaskAttachments from '../components/TaskAttachments'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [isRejecting, setIsRejecting] = useState(false)
  const { addEventListener, removeEventListener } = useWebSocket()
  const { t } = useLanguage()

  const loadTaskData = async () => {
    if (!taskId) return

    try {
      // First try to load normally
      const [taskData, executionsData, feedbacksData] = await Promise.all([
        taskApi.getById(taskId),
        executionApi.getByTaskId(taskId),
        feedbackApi.getByTaskId(taskId),
      ])

      setTask(taskData)
      setExecutions(executionsData)
      setFeedbacks(feedbacksData)
    } catch (error: any) {
      // If task not found, try loading with includeArchived
      if (error.response?.status === 404) {
        try {
          const [taskData, executionsData, feedbacksData] = await Promise.all([
            taskApi.getById(taskId, true), // Include archived
            executionApi.getByTaskId(taskId),
            feedbackApi.getByTaskId(taskId),
          ])

          setTask(taskData)
          setExecutions(executionsData)
          setFeedbacks(feedbacksData)
        } catch (archivedError: any) {
          toast.error(t('message.error.load'))
          console.error('Failed to load archived task:', archivedError)
        }
      } else {
        toast.error(t('message.error.load'))
        console.error('Failed to load task data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaskData()
    // Mark task as viewed
    if (taskId) {
      taskApi.markAsViewed(taskId).catch(console.error)
      // Also save to localStorage for immediate UI update
      const viewedTasks = JSON.parse(localStorage.getItem('viewedTasks') || '[]')
      if (!viewedTasks.includes(taskId)) {
        viewedTasks.push(taskId)
        localStorage.setItem('viewedTasks', JSON.stringify(viewedTasks))
      }
    }
  }, [taskId])

  useEffect(() => {
    const handleTaskUpdate = (data: any) => {
      // Check if the update is for the current task
      if (data.task && data.task.id === taskId) {
        const { previousStatus, newStatus } = data
        if (previousStatus && newStatus && previousStatus !== newStatus) {
          toast.success(t('message.updated'))
          // Reload the page to reflect the changes
          window.location.reload()
        }
      }
    }

    addEventListener('task_update', handleTaskUpdate)

    return () => {
      removeEventListener('task_update', handleTaskUpdate)
    }
  }, [taskId, addEventListener, removeEventListener])

  const handleExecuteTask = async () => {
    if (!task) return

    try {
      await taskApi.execute(task.id)
      toast.success(t('message.executed'))
      await loadTaskData()
    } catch (error) {
      toast.error(t('message.error'))
    }
  }

  const handleStatusChange = async (newStatus: 'review' | 'completed') => {
    if (!task) return

    try {
      await taskApi.update(task.id, { status: newStatus })
      toast.success(newStatus === 'review' ? t('message.updated') : t('message.approved'))
      await loadTaskData()
    } catch (error) {
      toast.error(t('message.error.save'))
    }
  }

  const handleAddFeedback = async (content: string) => {
    if (!task) return

    try {
      await feedbackApi.create(task.id, content)
      
      // 差戻し処理中の場合
      if (isRejecting) {
        await taskApi.reject(task.id)
        toast.success(t('message.rejected'))
        setIsRejecting(false)
      } else {
        toast.success(t('message.created'))
      }
      
      await loadTaskData()
    } catch (error) {
      toast.error(t('message.error.save'))
      setIsRejecting(false)
    }
  }

  const handleApprove = () => {
    if (!task || task.status !== 'review') return
    
    if (window.confirm(t('task.approve') + '?')) {
      handleStatusChange('completed')
    }
  }

  const handleReject = async () => {
    if (!task || task.status !== 'review') return
    
    // フィードバックタブに切り替える
    setActiveTab(3)
    setIsRejecting(true)
    toast(t('feedback.reject.reason'))
  }

  const handleArchive = async () => {
    if (!task) return
    
    if (window.confirm(t('task.archive') + '?\n' + t('archive.confirm.message'))) {
      try {
        console.log('Archiving task:', task.id)
        await taskApi.archive(task.id)
        console.log('Archive successful, showing toast')
        toast.success(t('message.archived'))
        
        // Navigate to home page using window.location instead of navigate
        console.log('Navigating to home page')
        window.location.href = '/'
      } catch (error: any) {
        console.error('Failed to archive task:', error)
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
        
        if (error.response?.status === 404) {
          toast.error('タスクが見つかりません')
        } else if (error.response?.status === 500) {
          toast.error('サーバーエラーが発生しました')
        } else {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || t('message.error.save')
          toast.error(errorMessage)
        }
      }
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    if (window.confirm(t('archive.confirm.delete'))) {
      try {
        await taskApi.delete(task.id)
        toast.success(t('message.deleted'))
        navigate('/', { replace: true })
      } catch (error) {
        toast.error(t('message.error.delete'))
        console.error('Failed to delete task:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('task.not.found')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary hover:underline"
        >
          {t('task.back.dashboard')}
        </button>
      </div>
    )
  }

  const latestExecution = executions[0]
  const isRunning = latestExecution?.status === 'running'

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={t('navigation.back')}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t('navigation.back')}</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-sm text-gray-500">ID: {task.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {task.status === 'pending' && (
            <button
              onClick={handleExecuteTask}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md"
            >
              <PlayIcon className="w-5 h-5" />
              {t('task.execute')}
            </button>
          )}

          {task.status === 'review' && (
            <>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90"
              >
                <XMarkIcon className="w-5 h-5" />
                {t('task.reject')}
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:opacity-90"
              >
                <CheckIcon className="w-5 h-5" />
                {t('task.approve')}
              </button>
            </>
          )}

          {isRunning && (
            <button
              onClick={async () => {
                try {
                  await executionApi.pause(latestExecution.id)
                  await taskApi.update(task.id, { status: 'pending' })
                  toast.success(t('message.paused'))
                  await loadTaskData()
                } catch (error) {
                  toast.error(t('message.error'))
                  console.error('Failed to pause task:', error)
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90"
            >
              <PauseIcon className="w-5 h-5" />
              {t('task.pause')}
            </button>
          )}

          {task.status === 'completed' && (
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArchiveBoxIcon className="w-5 h-5" />
              {t('task.archive')}
            </button>
          )}

          {/* Delete button - available for all statuses except working */}
          {task.status !== 'working' && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
              {t('button.delete')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
{t('tab.basic.info')}
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
{t('tab.execution.logs')} ({executions.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
{t('tab.outputs')}
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
{t('tab.feedback')} ({feedbacks.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
{t('tab.attachments')}
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <TaskInfo task={task} onUpdate={loadTaskData} />
          </Tab.Panel>
          <Tab.Panel>
            <ExecutionLogs executions={executions} />
          </Tab.Panel>
          <Tab.Panel>
            <OutputFiles taskId={task.id} executions={executions} />
          </Tab.Panel>
          <Tab.Panel>
            <FeedbackSection 
              feedbacks={feedbacks} 
              onAddFeedback={handleAddFeedback}
              canAddFeedback={task.status === 'review' || isRejecting}
            />
          </Tab.Panel>
          <Tab.Panel>
            <TaskAttachments 
              taskId={task.id} 
              canEdit={task.status !== 'completed' && task.status !== 'working'}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}