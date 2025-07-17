import React, { useState } from 'react'
import { PencilIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Task, UpdateTaskDto } from '../types/index'
import { taskApi, attachmentApi } from '../services/api'
import { formatDate } from '../utils/dateUtils'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'

interface TaskInfoProps {
  task: Task
  onUpdate: () => void
}

export default function TaskInfo({ task, onUpdate }: TaskInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const { t, language } = useLanguage()
  
  
  const [formData, setFormData] = useState<UpdateTaskDto>({
    title: task.title,
    description: task.description,
    priority: task.priority,
  })

  const handleSave = async () => {
    try {
      console.log('Updating task:', task.id, formData)
      await taskApi.update(task.id, formData)
      
      // Upload new attachments if any
      if (newAttachments.length > 0) {
        for (const file of newAttachments) {
          try {
            await attachmentApi.upload(task.id, file)
          } catch (error) {
            console.error('Failed to upload attachment:', error)
            toast.error(t('attachment.upload.failed'))
          }
        }
      }
      
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsEditing(false)
        setNewAttachments([])
        onUpdate()
      }, 1500)
    } catch (error: any) {
      console.error('Failed to update task:', error)
      const errorMessage = error.response?.data?.message || error.message || t('message.error.save')
      toast.error(errorMessage)
      // Log more details for debugging
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
    })
    setNewAttachments([])
    setIsEditing(false)
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewAttachments([...newAttachments, ...files])
  }

  const removeNewAttachment = (index: number) => {
    setNewAttachments(newAttachments.filter((_, i) => i !== index))
  }

  const getStatusBadge = () => {
    const statusMap = {
      pending: { label: t('task.pending'), class: 'bg-gray-100 text-gray-800' },
      requested: { label: t('task.requested'), class: 'bg-blue-100 text-blue-800' },
      working: { label: t('task.working'), class: 'bg-yellow-100 text-yellow-800' },
      review: { label: t('task.review'), class: 'bg-purple-100 text-purple-800' },
      completed: { label: t('task.completed'), class: 'bg-green-100 text-green-800' },
    }
    const status = statusMap[task.status]
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.class}`}>
        {status.label}
      </span>
    )
  }

  const getPriorityBadge = () => {
    const priorityMap = {
      high: { label: t('task.priority.high'), class: 'bg-red-100 text-red-800' },
      medium: { label: t('task.priority.medium'), class: 'bg-yellow-100 text-yellow-800' },
      low: { label: t('task.priority.low'), class: 'bg-green-100 text-green-800' },
    }
    const priority = priorityMap[task.priority]
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.class}`}>
        {priority.label}
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">{t('task.info')}</h2>
        {!isEditing && task.status !== 'completed' && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
{t('button.edit')}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium mb-1">{t('task.title')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('task.description')}</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('task.priority')}</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="low">{t('task.priority.low')}</option>
              <option value="medium">{t('task.priority.medium')}</option>
              <option value="high">{t('task.priority.high')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('attachments.title')}</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                <PaperClipIcon className="w-5 h-5" />
                <span>{t('attachment.select')}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.md,.json,.zip"
                />
              </label>
              
              {newAttachments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('attachment.new')}:</p>
                  {newAttachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewAttachment(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
{t('button.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
{t('button.save')}
            </button>
          </div>
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
{t('message.saved')}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t('task.status')}</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('task.priority')}</p>
              <div className="mt-1">{getPriorityBadge()}</div>
            </div>
          </div>

          {task.description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('task.description')}</p>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t('task.created')}</p>
              <p>{formatDate(task.created_at, language)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('task.updated')}</p>
              <p>{formatDate(task.updated_at, language)}</p>
            </div>
          </div>



          <div>
            <p className="text-sm text-gray-500">{t('task.version')}</p>
            <p>v{task.version}</p>
          </div>

        </div>
      )}
    </div>
  )
}