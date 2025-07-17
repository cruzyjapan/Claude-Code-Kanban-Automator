import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { Notification } from '../types/index'
import { notificationApi } from '../services/api'
import { useWebSocket } from './WebSocketContext'
import { useLanguage } from './LanguageContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loadNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  soundType: string
  setSoundType: (type: string) => void
  soundVolume: number
  setSoundVolume: (volume: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Notification sounds
const notificationSounds = {
  default: '/sounds/notification-default.mp3',
  chime: '/sounds/notification-chime.mp3',
  bell: '/sounds/notification-bell.mp3',
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled')
    return saved !== 'false'
  })
  const [soundType, setSoundType] = useState(() => {
    const saved = localStorage.getItem('soundType')
    return saved || 'default'
  })
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem('soundVolume')
    return saved ? parseInt(saved) : 50
  })
  const { addEventListener, removeEventListener } = useWebSocket()
  const { t, language } = useLanguage()

  const unreadCount = notifications.filter(n => !n.is_read).length

  const translateNotificationMessage = (title: string, message: string): { title: string; message: string } => {
    // Check if title and message are translation keys
    if (title.startsWith('notification.')) {
      const translatedTitle = t(title)
      
      // Handle message with parameters
      if (message.includes('|')) {
        const [messageKey, ...params] = message.split('|')
        if (messageKey.startsWith('notification.')) {
          let translatedMessage = t(messageKey)
          // Replace parameters {0}, {1}, etc.
          params.forEach((param, index) => {
            translatedMessage = translatedMessage.replace(`{${index}}`, param)
          })
          return { title: translatedTitle, message: translatedMessage }
        }
      } else if (message.startsWith('notification.')) {
        return { title: translatedTitle, message: t(message) }
      }
      
      return { title: translatedTitle, message }
    }
    
    return { title, message }
  }

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.getAll()
      // Translate existing notifications
      const translatedData = data.map(notification => {
        const { title, message } = translateNotificationMessage(notification.title, notification.message)
        return { ...notification, title, message }
      })
      setNotifications(translatedData)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [t])

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      // Clear all notifications from the list after marking as read
      setNotifications([])
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await notificationApi.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const playNotificationSound = (customSoundType?: string) => {
    if (!soundEnabled) return

    const currentSoundType = customSoundType || soundType

    try {
      // Use Web Audio API to generate notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const generateTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = type
        
        const volume = soundVolume / 100 * 0.3
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      }
      
      // Generate different sounds based on type
      switch (currentSoundType) {
        case 'chime':
          // High pitched ascending chimes (clearly different)
          generateTone(659, 0.12, 'sine')    // E note
          setTimeout(() => generateTone(880, 0.12, 'sine'), 120)   // A note
          setTimeout(() => generateTone(1047, 0.18, 'sine'), 240)  // C note
          setTimeout(() => generateTone(1319, 0.15, 'sine'), 360)  // E note (higher)
          break
        case 'bell':
          // Deep bell-like sound with distinct harmonics
          generateTone(220, 0.5, 'triangle')  // Low fundamental
          setTimeout(() => generateTone(440, 0.3, 'sine'), 30)    // Octave harmonic
          setTimeout(() => generateTone(660, 0.2, 'sine'), 60)    // Fifth harmonic
          setTimeout(() => generateTone(880, 0.15, 'sine'), 90)   // Octave harmonic
          break
        default: // default
          // Simple two-tone notification (more distinct)
          generateTone(800, 0.18, 'square')
          setTimeout(() => generateTone(600, 0.22, 'square'), 180)
          break
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error)
      
      // Fallback: try to use audio file if Web Audio API fails
      try {
        const audio = new Audio(notificationSounds[soundType as keyof typeof notificationSounds] || notificationSounds.default)
        audio.volume = 0.5
        audio.play().catch(console.error)
      } catch (fallbackError) {
        console.error('Audio fallback also failed:', fallbackError)
      }
    }
  }

  const handleNotification = useCallback((data: Notification) => {
    // Translate notification messages
    const { title, message } = translateNotificationMessage(data.title, data.message)
    
    // Check for duplicate notifications
    setNotifications(prev => {
      const exists = prev.find(n => n.id === data.id)
      if (exists) return prev
      return [{ ...data, title, message }, ...prev]
    })

    // Show toast notification only once
    const toastType = data.type === 'task_error' ? 'error' : 'success'
    toast[toastType](message, {
      duration: 5000,
      icon: data.type === 'review_request' ? '👁️' : undefined,
      id: data.id, // Prevent duplicate toasts
    })

    // Play sound
    playNotificationSound()

    // Request browser notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192.png',
        tag: data.id, // This prevents duplicate browser notifications
      })
    }
  }, [soundEnabled, t])

  useEffect(() => {
    // Load initial notifications
    loadNotifications()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [loadNotifications])

  useEffect(() => {
    // Subscribe to WebSocket notifications
    addEventListener('notification', handleNotification)

    return () => {
      removeEventListener('notification', handleNotification)
    }
  }, [addEventListener, removeEventListener, handleNotification])

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('soundType', soundType)
  }, [soundType])

  useEffect(() => {
    localStorage.setItem('soundVolume', String(soundVolume))
  }, [soundVolume])

  // Re-translate notifications when language changes
  useEffect(() => {
    if (notifications.length > 0) {
      const translatedData = notifications.map(notification => {
        const { title, message } = translateNotificationMessage(notification.title, notification.message)
        return { ...notification, title, message }
      })
      setNotifications(translatedData)
    }
  }, [language])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        soundEnabled,
        setSoundEnabled,
        soundType,
        setSoundType,
        soundVolume,
        setSoundVolume,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}