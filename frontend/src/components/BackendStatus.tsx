import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'
import { systemApi } from '../services/api'

export default function BackendStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const { t } = useLanguage()

  const checkBackendStatus = async () => {
    try {
      await systemApi.getHealth()
      setIsOnline(true)
      setLastCheck(new Date())
    } catch (error) {
      setIsOnline(false)
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (isOnline === null) return 'text-gray-500'
    return isOnline ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = () => {
    if (isOnline === null) {
      return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
    }
    return isOnline ? (
      <CheckCircleIcon className="w-5 h-5 text-green-600" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-600" />
    )
  }

  const getStatusText = () => {
    if (isOnline === null) return t('backend.status.checking')
    return isOnline ? t('backend.status.online') : t('backend.status.offline')
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {t('backend.status.label')}: {getStatusText()}
      </span>
      {!isOnline && (
        <div className="ml-2 text-xs text-gray-600">
          <div>{t('backend.status.start_command')}:</div>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            cd backend && npm run dev
          </code>
        </div>
      )}
    </div>
  )
}