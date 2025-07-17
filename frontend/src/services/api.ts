import axios from 'axios'
import { Task, CreateTaskDto, UpdateTaskDto, Execution, Feedback, Notification, TaskQueue, UserSettings } from '../types/index'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to set Content-Type only for JSON requests
api.interceptors.request.use((config) => {
  // Only set Content-Type if it's not FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

// Tasks API
export const taskApi = {
  getAll: async (params?: { status?: string; priority?: string; search?: string }) => {
    const response = await api.get<Task[]>('/tasks', { params })
    return response.data
  },

  getById: async (id: string, includeArchived: boolean = false) => {
    const response = await api.get<Task>(`/tasks/${id}`, {
      params: includeArchived ? { includeArchived: 'true' } : {}
    })
    return response.data
  },

  create: async (data: CreateTaskDto) => {
    const response = await api.post<Task>('/tasks', data)
    return response.data
  },

  update: async (id: string, data: UpdateTaskDto) => {
    const response = await api.put<Task>(`/tasks/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/tasks/${id}`)
  },

  execute: async (id: string) => {
    const response = await api.post(`/tasks/${id}/execute`)
    return response.data
  },

  reject: async (id: string) => {
    const response = await api.post(`/tasks/${id}/reject`)
    return response.data
  },

  getByStatus: async (status: string) => {
    const response = await api.get<Task[]>(`/tasks/status/${status}`)
    return response.data
  },

  getQueue: async (status: string) => {
    const response = await api.get<TaskQueue[]>(`/queue/${status}`)
    return response.data
  },

  updateQueue: async (status: string, tasks: { task_id: string; position: number }[]) => {
    const response = await api.put(`/queue/${status}`, { tasks })
    return response.data
  },

  archive: async (id: string) => {
    const response = await api.post(`/tasks/${id}/archive`)
    return response.data
  },

  getArchived: async () => {
    const response = await api.get<Task[]>('/tasks/archived/list')
    return response.data
  },

  permanentlyDelete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}/permanent`)
    return response.data
  },

  markAsViewed: async (id: string, userId: string = 'default') => {
    const response = await api.post(`/tasks/${id}/view`, { userId })
    return response.data
  },

  forceCleanup: async () => {
    const response = await api.post('/tasks/force-cleanup')
    return response.data
  },
}

// Executions API
export const executionApi = {
  getByTaskId: async (taskId: string) => {
    const response = await api.get<Execution[]>(`/tasks/${taskId}/executions`)
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get<Execution>(`/executions/${id}`)
    return response.data
  },

  pause: async (id: string) => {
    const response = await api.post(`/executions/${id}/pause`)
    return response.data
  },
}

// Feedback API
export const feedbackApi = {
  create: async (taskId: string, content: string) => {
    const response = await api.post<Feedback>(`/tasks/${taskId}/feedback`, { content })
    return response.data
  },

  getByTaskId: async (taskId: string) => {
    const response = await api.get<Feedback[]>(`/tasks/${taskId}/feedback`)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/feedback/${id}`)
  },
}

// Notifications API
export const notificationApi = {
  getAll: async (userId: string = 'default', unreadOnly: boolean = false) => {
    const response = await api.get<Notification[]>('/notifications', {
      params: { userId, unreadOnly },
    })
    return response.data
  },

  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`)
  },

  markAllAsRead: async (userId: string = 'default') => {
    await api.put('/notifications/read-all', { userId })
  },

  delete: async (id: string) => {
    await api.delete(`/notifications/${id}`)
  },
}

// Settings API
export const settingsApi = {
  get: async (userId: string = 'default') => {
    const response = await api.get<UserSettings>(`/settings/${userId}`)
    return response.data
  },

  update: async (settings: Partial<UserSettings>, userId: string = 'default') => {
    const response = await api.put(`/settings/${userId}`, settings)
    return response.data
  },
}

// Attachments API
export const attachmentApi = {
  upload: async (taskId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadedBy', 'default')
    
    console.log('Uploading file:', file.name, 'size:', file.size, 'type:', file.type)
    console.log('Task ID:', taskId)
    console.log('Upload URL:', `/tasks/${taskId}/attachments`)
    
    try {
      // Don't set Content-Type header - let browser set it automatically with boundary
      const response = await api.post(`/tasks/${taskId}/attachments`, formData)
      console.log('Upload response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Upload error details:', error.response?.data || error.message)
      throw error
    }
  },

  getByTaskId: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/attachments`)
    return response.data
  },

  download: async (id: string) => {
    window.open(`/api/attachments/${id}/download`, '_blank')
  },

  view: async (id: string) => {
    window.open(`/api/attachments/${id}/view`, '_blank')
  },

  delete: async (id: string) => {
    const response = await api.delete(`/attachments/${id}`)
    return response.data
  },
}

// System Status API
export const systemApi = {
  getHealth: async () => {
    const response = await api.get<{
      status: string;
      timestamp: string;
      websocket_clients: number;
    }>('/health')
    return response.data
  },

  getRunningTasks: async () => {
    const response = await api.get<Task[]>('/tasks', { params: { status: 'working' } })
    return response.data
  }
}

// Claude Code API
export const claudeCodeApi = {
  testConnection: async () => {
    const response = await api.post<{
      success: boolean
      message: string
      output?: string
      error?: string
      responseTime?: number
      command?: string
    }>('/claude-code/test')
    return response.data
  }
}

export default api