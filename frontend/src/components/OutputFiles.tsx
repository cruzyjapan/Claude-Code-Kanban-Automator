import React, { useState, useEffect } from 'react'
import { DocumentTextIcon, CodeBracketIcon, PhotoIcon, ArchiveBoxIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Execution } from '../types/index'
import { useLanguage } from '../contexts/LanguageContext'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface OutputFile {
  name: string
  path: string
  type: string
  size: number
  id?: string
}

interface OutputFilesProps {
  taskId: string
  executions: Execution[]
}

export default function OutputFiles({ taskId, executions }: OutputFilesProps) {
  const [files, setFiles] = useState<OutputFile[]>([])
  const [selectedFile, setSelectedFile] = useState<OutputFile | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  // Get the latest successful execution
  const latestSuccessfulExecution = executions.find(
    (exec) => exec.status === 'completed' && exec.output_path
  )

  useEffect(() => {
    if (taskId) {
      loadOutputFiles()
    }
  }, [taskId, executions])

  const loadOutputFiles = async () => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}/output-files`)
      const apiFiles = response.data
      
      // Transform API response to match OutputFile interface
      const transformedFiles: OutputFile[] = apiFiles.map((file: any) => {
        let type = file.file_type.replace('.', '') // Remove dot from extension
        // Map file extensions to types
        if (type === 'md') type = 'markdown'
        if (type === 'py') type = 'python'
        if (type === 'js') type = 'javascript'
        if (type === 'ts') type = 'typescript'
        
        return {
          name: file.file_name,
          path: file.file_path,
          type,
          size: file.file_size,
          id: file.id
        }
      })
      
      setFiles(transformedFiles)
    } catch (error) {
      console.error('Failed to load output files:', error)
      setFiles([])
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <DocumentTextIcon className="w-5 h-5" />
      case 'python':
      case 'javascript':
      case 'typescript':
      case 'json':
        return <CodeBracketIcon className="w-5 h-5" />
      case 'image':
        return <PhotoIcon className="w-5 h-5" />
      default:
        return <ArchiveBoxIcon className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFileClick = async (file: OutputFile) => {
    setSelectedFile(file)
    setLoading(true)
    
    try {
      // If file has an ID, fetch from API, otherwise read directly
      if (file.id) {
        const response = await axios.get(`/api/output-files/${file.id}/content`)
        setFileContent(response.data.content)
      } else {
        // Fallback to direct file reading
        const response = await axios.get(file.path)
        setFileContent(response.data)
      }
    } catch (error) {
      console.error('Failed to load file content:', error)
      setFileContent(t('output.error.load'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: OutputFile) => {
    if (file.id) {
      // Use the API endpoint for download
      window.open(`/api/output-files/${file.id}/download`, '_blank')
    } else {
      // Fallback for files without ID
      console.error('File ID not available for download')
    }
  }

  const handleBulkDownload = async () => {
    try {
      // Create a download link for all files as a zip
      const fileIds = files.filter(f => f.id).map(f => f.id).join(',')
      if (fileIds) {
        window.open(`/api/tasks/${taskId}/download-all?files=${fileIds}`, '_blank')
      }
    } catch (error) {
      console.error('Failed to download files:', error)
    }
  }

  const renderFileContent = () => {
    if (!selectedFile || loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    switch (selectedFile.type) {
      case 'markdown':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{fileContent}</ReactMarkdown>
          </div>
        )
      
      case 'python':
      case 'javascript':
      case 'typescript':
      case 'json':
        return (
          <SyntaxHighlighter
            language={selectedFile.type}
            style={oneDark}
            customStyle={{ margin: 0, fontSize: '0.875rem' }}
          >
            {fileContent}
          </SyntaxHighlighter>
        )
      
      default:
        return (
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {fileContent}
          </pre>
        )
    }
  }

  if (!latestSuccessfulExecution) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <p className="text-center text-gray-500">
{t('output.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* File list */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('output.file.list')}</h3>
            {files.length > 0 && (
              <button
                onClick={() => handleBulkDownload()}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                title={t('output.download.all')}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {t('output.download.all')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => handleFileClick(file)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFile?.name === file.name
                    ? 'bg-primary/10 border border-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(file)
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title={t('output.download')}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File preview */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{selectedFile.name}</h3>
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
{t('output.download')}
                </button>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {renderFileContent()}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-16">
{t('output.select.file')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}