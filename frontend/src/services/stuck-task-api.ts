import api from './api'

export const stuckTaskApi = {
  getStuckTasks: async () => {
    const response = await api.get('/stuck-tasks')
    return response.data
  },

  restartTask: async (taskId: string) => {
    const response = await api.post(`/tasks/${taskId}/restart`)
    return response.data
  }
}