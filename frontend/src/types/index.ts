export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'requested' | 'working' | 'review' | 'completed'
export type NotificationType = 'task_start' | 'task_complete' | 'task_error' | 'review_request' | 'feedback_complete' | 'system_info'

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  created_at: string
  updated_at: string
  version: number
  estimated_hours?: number
  actual_hours?: number
  assigned_ai?: string
  tags?: string[]
  last_viewed_at?: string
  attachment_count?: number
}

export interface Execution {
  id: string
  task_id: string
  version: number
  started_at: string
  completed_at?: string
  status: 'running' | 'paused' | 'completed' | 'failed'
  output_path?: string
  error_message?: string
  execution_logs?: string
  retry_count: number
}

export interface Feedback {
  id: string
  task_id: string
  user_id?: string
  content: string
  created_at: string
  addressed: boolean
  addressed_version?: number
}

export interface Notification {
  id: string
  user_id?: string
  task_id?: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
  priority: TaskPriority
}

export interface UserSettings {
  user_id: string
  desktop_notifications: boolean
  sound_enabled: boolean
  sound_volume: number
  sound_type: string
  notify_review_request: boolean
  notify_task_complete: boolean
  notify_error: boolean
  notify_task_start: boolean
  notify_feedback_complete: boolean
  theme: string
  language: string
  task_timeout_minutes: number
  enable_task_timeout: boolean
  enable_dangerous_permissions?: number
  permission_config?: string
}

export interface CreateTaskDto {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface TaskQueue {
  task_id: string
  position: number
}

export interface TaskAttachment {
  id: string
  task_id: string
  file_path: string
  file_name: string
  file_type?: string
  file_size?: number
  uploaded_at: string
  uploaded_by?: string
}