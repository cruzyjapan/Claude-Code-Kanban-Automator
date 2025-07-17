import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { systemApi, claudeCodeApi } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useSystemStatus } from '../contexts/SystemStatusContext'
import toast from 'react-hot-toast'

interface ClaudeCodeStatusProps {
  className?: string
}

type StatusType = 'online' | 'offline' | 'busy' | 'checking'

export default function ClaudeCodeStatus({ className = '' }: ClaudeCodeStatusProps) {
  const [runningTasks, setRunningTasks] = useState(0)
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const { t, language } = useLanguage()
  const { status: systemStatus, lastCheck } = useSystemStatus()

  // Convert system status to local status with task count
  const [status, setStatus] = useState<StatusType>('checking')

  useEffect(() => {
    const updateStatus = async () => {
      if (systemStatus === 'online') {
        try {
          const workingTasks = await systemApi.getRunningTasks()
          setRunningTasks(workingTasks.length)
          setStatus(workingTasks.length > 0 ? 'busy' : 'online')
        } catch (error) {
          setStatus('offline')
        }
      } else if (systemStatus === 'offline') {
        setStatus('offline')
      } else {
        setStatus('checking')
      }
    }
    
    updateStatus()
  }, [systemStatus])

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'busy':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      case 'offline':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return language === 'ja' ? 'Claude Code: オンライン' : 'Claude Code: Online'
      case 'busy':
        return language === 'ja' ? `Claude Code: 作業中 (${runningTasks}件)` : `Claude Code: Busy (${runningTasks} tasks)`
      case 'offline':
        return language === 'ja' ? 'Claude Code: オフライン' : 'Claude Code: Offline'
      default:
        return language === 'ja' ? 'Claude Code: 確認中' : 'Claude Code: Checking'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600 dark:text-green-400'
      case 'busy':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'offline':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleTestConnection = async () => {
    if (isTesting) return

    setIsTesting(true)
    setTestProgress(0)
    
    // Start progress timer
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setTestProgress(elapsed)
    }, 1000)

    let toastId = toast.loading(
      language === 'ja' ? 'Claude Code接続テスト中...' : 'Testing Claude Code connection...'
    )
    
    // Update toast message every 5 seconds
    const toastInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      toast.loading(
        language === 'ja' 
          ? `Claude Code接続テスト中... (${elapsed}秒経過)` 
          : `Testing Claude Code connection... (${elapsed}s elapsed)`,
        { id: toastId }
      )
    }, 5000)

    try {
      const result = await claudeCodeApi.testConnection()
      
      if (result.success) {
        toast.success(
          language === 'ja' 
            ? `接続成功！ 応答時間: ${result.responseTime}ms` 
            : `Connection successful! Response time: ${result.responseTime}ms`,
          { id: toastId }
        )
      } else {
        toast.error(
          language === 'ja' 
            ? `接続失敗: ${result.error || result.message}` 
            : `Connection failed: ${result.error || result.message}`,
          { id: toastId }
        )
      }
      
      // Log details for debugging
      console.log('Claude Code test result:', result)
    } catch (error: any) {
      toast.error(
        language === 'ja' 
          ? `テスト中にエラーが発生しました: ${error.message}` 
          : `Error during test: ${error.message}`,
        { id: toastId }
      )
      console.error('Claude Code test error:', error)
    } finally {
      clearInterval(progressInterval)
      clearInterval(toastInterval)
      setIsTesting(false)
      setTestProgress(0)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastCheck && (
        <span className="text-xs text-gray-500">
          {language === 'ja' ? '最終確認: ' : 'Last check: '}
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={handleTestConnection}
        disabled={isTesting}
        className={`
          p-2 rounded-lg transition-all
          ${isTesting 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
          }
          border border-gray-200 dark:border-gray-700
          flex items-center gap-1.5 text-sm font-medium
        `}
        title={language === 'ja' ? 'Claude Code接続テスト' : 'Test Claude Code Connection'}
      >
        <BeakerIcon className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
        {isTesting ? (
          <span className="flex items-center gap-1">
            {language === 'ja' ? 'テスト中' : 'Testing'}
            <span className="text-xs">({testProgress}s)</span>
          </span>
        ) : (
          language === 'ja' ? 'テスト' : 'Test'
        )}
      </button>
    </div>
  )
}