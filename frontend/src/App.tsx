import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TaskDetail from './pages/TaskDetail'
import Settings from './pages/Settings'
import ArchivePage from './pages/ArchivePage'
import { ThemeProvider } from './contexts/ThemeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { SystemStatusProvider } from './contexts/SystemStatusContext'

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SystemStatusProvider>
          <WebSocketProvider>
            <NotificationProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks/:taskId" element={<TaskDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/archive" element={<ArchivePage />} />
              </Routes>
            </Layout>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </NotificationProvider>
        </WebSocketProvider>
      </SystemStatusProvider>
    </ThemeProvider>
  </LanguageProvider>
  )
}

export default App