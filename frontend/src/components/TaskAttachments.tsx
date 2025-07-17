import React, { useState, useEffect } from 'react'
import { PaperClipIcon, DocumentIcon, PhotoIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { TaskAttachment } from '../types/index'
import { attachmentApi } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'

interface TaskAttachmentsProps {
  taskId: string
  canEdit: boolean
}

export default function TaskAttachments({ taskId, canEdit }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    loadAttachments()
  }, [taskId])

  const loadAttachments = async () => {
    try {
      const data = await attachmentApi.getByTaskId(taskId)
      setAttachments(data)
    } catch (error) {
      console.error('Failed to load attachments:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const file = files[0]

    console.log('Uploading file:', file.name, 'for task:', taskId)

    try {
      const attachment = await attachmentApi.upload(taskId, file)
      console.log('Upload successful:', attachment)
      setAttachments([attachment, ...attachments])
      toast.success(t('attachment.uploaded') || 'File uploaded successfully')
    } catch (error: any) {
      console.error('Failed to upload file:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.error || t('attachment.upload.failed') || 'Failed to upload file')
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const handleDelete = async (attachment: TaskAttachment) => {
    if (!window.confirm(t('attachment.delete.confirm'))) return

    try {
      await attachmentApi.delete(attachment.id)
      setAttachments(attachments.filter(a => a.id !== attachment.id))
      toast.success(t('attachment.deleted'))
    } catch (error) {
      toast.error(t('attachment.delete.failed'))
      console.error('Failed to delete attachment:', error)
    }
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <DocumentIcon className="w-5 h-5" />
    
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5" />
    }
    
    return <DocumentIcon className="w-5 h-5" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PaperClipIcon className="w-5 h-5" />
          {t('attachments.title')}
        </h3>
        
        {canEdit && (
          <label className="cursor-pointer">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.json,.zip"
            />
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              {uploading ? t('attachment.uploading') : t('attachment.upload')}
            </span>
          </label>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {t('attachments.empty')}
        </p>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(attachment.file_type)}
                <div>
                  <p className="font-medium text-sm">{attachment.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => attachmentApi.view(attachment.id)}
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title={t('attachment.view')}
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => attachmentApi.download(attachment.id)}
                  className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                  title={t('attachment.download')}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(attachment)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title={t('attachment.delete')}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}