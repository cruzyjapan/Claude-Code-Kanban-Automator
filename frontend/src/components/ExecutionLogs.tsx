import React, { useState } from 'react'
import { Execution } from '../types/index'
import { formatDate } from '../utils/dateUtils'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'
import clsx from 'clsx'

interface ExecutionLogsProps {
  executions: Execution[]
}

export default function ExecutionLogs({ executions }: ExecutionLogsProps) {
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set())
  const { t, language } = useLanguage()

  const toggleExpanded = (executionId: string) => {
    const newExpanded = new Set(expandedExecutions)
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId)
    } else {
      newExpanded.add(executionId)
    }
    setExpandedExecutions(newExpanded)
  }

  const getStatusBadge = (status: Execution['status']) => {
    const statusMap = {
      running: { label: t('execution.running'), class: 'bg-blue-100 text-blue-800' },
      paused: { label: t('execution.paused'), class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: t('execution.completed'), class: 'bg-green-100 text-green-800' },
      failed: { label: t('execution.failed'), class: 'bg-red-100 text-red-800' },
    }
    const statusInfo = statusMap[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getDuration = (execution: Execution) => {
    if (!execution.completed_at) return t('execution.in.progress')
    
    const start = new Date(execution.started_at).getTime()
    const end = new Date(execution.completed_at).getTime()
    const durationMs = end - start
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}${t('time.hours')}${minutes}${t('time.minutes')}${seconds}${t('time.seconds')}`
    } else if (minutes > 0) {
      return `${minutes}${t('time.minutes')}${seconds}${t('time.seconds')}`
    } else {
      return `${seconds}${t('time.seconds')}`
    }
  }

  if (executions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <p className="text-center text-gray-500">{t('execution.empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {executions.map((execution) => {
        const isExpanded = expandedExecutions.has(execution.id)
        
        return (
          <div
            key={execution.id}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
          >
            <div
              onClick={() => toggleExpanded(execution.id)}
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{t('task.version')} {execution.version}</p>
                      {getStatusBadge(execution.status)}
                      {execution.retry_count > 0 && (
                        <span className="text-xs text-gray-500">
                          ({t('execution.retry')}: {execution.retry_count}{t('execution.times')})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('execution.started')}: {formatDate(execution.started_at, language, 'yyyy/MM/dd HH:mm:ss')}
                      {' | '}
                      {t('execution.duration')}: {getDuration(execution)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="p-4 space-y-4">
                  {execution.error_message && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">{t('execution.error')}</p>
                      <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-200 overflow-x-auto">
                        {execution.error_message}
                      </pre>
                    </div>
                  )}

                  {execution.execution_logs && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('execution.logs')}</p>
                      <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto max-h-96">
                        {execution.execution_logs}
                      </pre>
                    </div>
                  )}

                  {execution.output_path && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('execution.output.path')}</p>
                      <p className="text-sm font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        {execution.output_path}
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    ID: {execution.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}