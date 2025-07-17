export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'requested' | 'working' | 'review' | 'completed';
export type ExecutionStatus = 'running' | 'paused' | 'completed' | 'failed';
export type NotificationType = 'task_start' | 'task_complete' | 'task_error' | 'review_request' | 'feedback_complete' | 'system_info';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
  version: number;
  estimated_hours?: number;
  actual_hours?: number;
  assigned_ai?: string;
  is_deleted: boolean;
  attachment_count?: number;
}

export interface Execution {
  id: string;
  task_id: string;
  version: number;
  started_at: Date;
  completed_at?: Date;
  status: ExecutionStatus;
  output_path?: string;
  error_message?: string;
  execution_logs?: string;
  retry_count: number;
}

export interface Feedback {
  id: string;
  task_id: string;
  user_id?: string;
  content: string;
  created_at: Date;
  addressed: boolean;
  addressed_version?: number;
}

export interface TaskQueue {
  task_id: string;
  status: string;
  position: number;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id?: string;
  task_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  action_url?: string;
  priority: TaskPriority;
}

export interface UserSettings {
  user_id: string;
  desktop_notifications: number;
  sound_enabled: number;
  sound_volume: number;
  sound_type: string;
  notify_review_request: number;
  notify_task_complete: number;
  notify_error: number;
  notify_task_start: number;
  notify_feedback_complete: number;
  theme: string;
  language: string;
  task_timeout_minutes: number;
  enable_task_timeout: number;
  enable_dangerous_permissions: number;
  permission_config: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  template_data: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: Date;
}

export interface OutputFile {
  id: string;
  task_id: string;
  execution_id: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  created_at: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface CreateFeedbackDto {
  content: string;
  user_id?: string;
}

export interface UpdateQueueDto {
  tasks: Array<{
    task_id: string;
    position: number;
  }>;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}