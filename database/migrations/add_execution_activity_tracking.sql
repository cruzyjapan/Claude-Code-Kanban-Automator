-- Add last_activity_at column to track execution activity
ALTER TABLE executions ADD COLUMN last_activity_at DATETIME;