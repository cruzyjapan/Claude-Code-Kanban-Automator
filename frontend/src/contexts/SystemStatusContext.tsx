import React, { createContext, useContext, useState, useEffect } from 'react'
import { systemApi } from '../services/api'
import toast from 'react-hot-toast'

type SystemStatus = 'online' | 'offline' | 'checking'

interface SystemStatusContextType {
  status: SystemStatus
  lastCheck: Date | null
  isOnline: boolean
  checkSystemStatus: () => Promise<void>
}

const SystemStatusContext = createContext<SystemStatusContextType | undefined>(undefined)

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SystemStatus>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [hasShownOfflineAlert, setHasShownOfflineAlert] = useState(false)

  const checkSystemStatus = async () => {
    try {
      const health = await systemApi.getHealth()
      const workingTasks = await systemApi.getRunningTasks()
      
      if (health.status === 'ok') {
        // Check for stuck tasks
        const hasStuckTasks = workingTasks.some(task => {
          const updatedAt = new Date(task.updated_at)
          const now = new Date()
          const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60)
          return minutesSinceUpdate > 15
        })
        
        if (hasStuckTasks) {
          setStatus('offline')
          // Show alert only once when first detecting offline state
          if (!hasShownOfflineAlert) {
            toast.error('Claude Codeが応答しません。タスクが停止している可能性があります。', {
              id: 'claude-offline-alert',
              duration: 5000,
            })
            setHasShownOfflineAlert(true)
          }
        } else {
          setStatus('online')
          // Reset alert flag when back online
          if (hasShownOfflineAlert) {
            setHasShownOfflineAlert(false)
            toast.success('Claude Codeが復旧しました。', {
              id: 'claude-online-alert',
              duration: 3000,
            })
          }
        }
      } else {
        setStatus('offline')
        // Show alert only once when first detecting offline state
        if (!hasShownOfflineAlert) {
          toast.error('Claude Codeがオフラインです。', {
            id: 'claude-offline-alert',
            duration: 5000,
          })
          setHasShownOfflineAlert(true)
        }
      }
      
      setLastCheck(new Date())
    } catch (error) {
      console.error('Failed to check system status:', error)
      setStatus('offline')
      // Show alert only once when first detecting offline state
      if (!hasShownOfflineAlert) {
        toast.error('Claude Codeへの接続に失敗しました。', {
          id: 'claude-offline-alert',
          duration: 5000,
        })
        setHasShownOfflineAlert(true)
      }
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 15000) // Check every 15 seconds
    return () => clearInterval(interval)
  }, [hasShownOfflineAlert])

  return (
    <SystemStatusContext.Provider
      value={{
        status,
        lastCheck,
        isOnline: status === 'online',
        checkSystemStatus,
      }}
    >
      {children}
    </SystemStatusContext.Provider>
  )
}

export function useSystemStatus() {
  const context = useContext(SystemStatusContext)
  if (context === undefined) {
    throw new Error('useSystemStatus must be used within a SystemStatusProvider')
  }
  return context
}