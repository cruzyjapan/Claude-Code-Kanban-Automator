-- Claude Code Kanban Automator Database Schema

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('pending', 'requested', 'working', 'review', 'completed')) DEFAULT 'pending',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    estimated_hours REAL,
    actual_hours REAL,
    assigned_ai TEXT,
    is_deleted INTEGER DEFAULT 0
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Executions table
CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    last_activity_at DATETIME,
    status TEXT CHECK(status IN ('running', 'paused', 'completed', 'failed')) DEFAULT 'running',
    output_path TEXT,
    error_message TEXT,
    execution_logs TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    addressed INTEGER DEFAULT 0,
    addressed_version INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Task queue table for managing execution order
CREATE TABLE IF NOT EXISTS task_queue (
    task_id TEXT NOT NULL,
    status TEXT NOT NULL,
    position INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, status),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Trigger to update task_queue timestamp
CREATE TRIGGER IF NOT EXISTS update_task_queue_timestamp 
AFTER UPDATE ON task_queue
BEGIN
    UPDATE task_queue SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id AND status = NEW.status;
END;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    task_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    action_url TEXT,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    desktop_notifications INTEGER DEFAULT 1,
    sound_enabled INTEGER DEFAULT 1,
    sound_volume INTEGER DEFAULT 50,
    sound_type TEXT DEFAULT 'default',
    notify_review_request INTEGER DEFAULT 1,
    notify_task_complete INTEGER DEFAULT 1,
    notify_error INTEGER DEFAULT 1,
    notify_task_start INTEGER DEFAULT 0,
    notify_feedback_complete INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'auto',
    language TEXT DEFAULT 'ja',
    task_timeout_minutes INTEGER DEFAULT 10,
    enable_task_timeout INTEGER DEFAULT 1,
    enable_dangerous_permissions INTEGER DEFAULT 0,
    permission_config TEXT, -- JSON string for custom permission configuration
    custom_prompt_instructions TEXT DEFAULT '', -- Custom instructions for all tasks
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update user_settings timestamp
CREATE TRIGGER IF NOT EXISTS update_user_settings_timestamp 
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

-- Task templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    template_data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- Task tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task-tag relationship table
CREATE TABLE IF NOT EXISTS task_tags (
    task_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Task views table to track when users view tasks
CREATE TABLE IF NOT EXISTS task_views (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, user_id)
);

-- Task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Output files table
CREATE TABLE IF NOT EXISTS output_files (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (execution_id) REFERENCES executions(id)
);

-- Analytics table for tracking metrics
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_value REAL,
    metadata TEXT, -- JSON string
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_executions_task_id ON executions(task_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_task_id ON feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_position ON task_queue(position);
CREATE INDEX IF NOT EXISTS idx_task_views_task_user ON task_views(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_task_views_viewed_at ON task_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);