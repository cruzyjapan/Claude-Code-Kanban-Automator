-- Add task_views table to track when users view tasks
CREATE TABLE IF NOT EXISTS task_views (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_views_task_user ON task_views(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_task_views_viewed_at ON task_views(viewed_at);