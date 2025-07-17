import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface WebSocketMessage {
  type: string
  data: any
}

interface WebSocketContextType {
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  addEventListener: (type: string, handler: (data: any) => void) => void
  removeEventListener: (type: string, handler: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const eventHandlers = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)

  const connect = () => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping', data: {} }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000)
      }

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          
          // Handle specific message types
          const handlers = eventHandlers.current.get(message.type)
          if (handlers) {
            handlers.forEach(handler => handler(message.data))
          }

          // Handle global message types
          switch (message.type) {
            case 'welcome':
              console.log('WebSocket welcome:', message.data)
              break
            case 'pong':
              // Pong received, connection is alive
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        
        if (reconnectAttempts.current <= 5) {
          console.log(`Reconnecting in ${delay}ms...`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          toast.error('WebSocket接続が失われました。ページを更新してください。')
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  const addEventListener = (type: string, handler: (data: any) => void) => {
    if (!eventHandlers.current.has(type)) {
      eventHandlers.current.set(type, new Set())
    }
    eventHandlers.current.get(type)!.add(handler)
  }

  const removeEventListener = (type: string, handler: (data: any) => void) => {
    eventHandlers.current.get(type)?.delete(handler)
  }

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        addEventListener,
        removeEventListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}