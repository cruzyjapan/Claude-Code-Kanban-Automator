import React, { useState } from 'react'
import { XMarkIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CreateTaskDto, TaskPriority } from '../types/index'
import { useLanguage } from '../contexts/LanguageContext'

interface CreateTaskModalProps {
  onClose: () => void
  onCreate: (task: CreateTaskDto, attachments: File[]) => void
}

export default function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert(t('task.title') + t('required'))
      return
    }
    
    try {
      await onCreate(formData, attachments)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Failed to create task:', error)
      // Error is already handled in onCreate function with toast
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('task.create.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('task.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              placeholder={t('task.title.placeholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('task.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              placeholder={t('task.description.placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('task.priority')}</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
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
              
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
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

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
{t('button.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
{t('button.create')}
            </button>
          </div>
        </form>
        {showSuccess && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">{t('message.created')}!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}