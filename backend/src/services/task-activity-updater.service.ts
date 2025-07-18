import { getDatabase } from './database.service';

export class TaskActivityUpdater {
  private db = getDatabase();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic updates of task activity timestamps
   */
  startUpdating(intervalMs: number = 30000): void {
    console.log(`[TaskActivityUpdater] Starting activity updates with interval: ${intervalMs}ms`);
    
    // Initial update
    this.updateWorkingTasks();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateWorkingTasks();
    }, intervalMs);
  }

  /**
   * Stop activity updates
   */
  stopUpdating(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('[TaskActivityUpdater] Activity updates stopped');
    }
  }

  /**
   * Update activity timestamp for all working tasks with running executions
   */
  private async updateWorkingTasks(): Promise<void> {
    try {
      // Find working tasks with active executions
      await this.db.run(`
        UPDATE tasks
        SET updated_at = CURRENT_TIMESTAMP
        WHERE status = 'working'
          AND id IN (
            SELECT DISTINCT task_id 
            FROM executions 
            WHERE status = 'running'
              AND (
                last_activity_at IS NULL 
                OR datetime(last_activity_at, '+30 seconds') > datetime('now', 'localtime')
              )
          )
      `);

      // Check how many tasks were updated
      const updatedTasks = await this.db.get(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'working'
          AND id IN (
            SELECT DISTINCT task_id 
            FROM executions 
            WHERE status = 'running'
          )
      `);

      if (updatedTasks && updatedTasks.count > 0) {
        console.log(`[TaskActivityUpdater] Updated activity for ${updatedTasks.count} working tasks`);
      }
    } catch (error) {
      console.error('[TaskActivityUpdater] Error updating task activity:', error);
    }
  }

  /**
   * Update activity for a specific task
   */
  async updateTaskActivity(taskId: string): Promise<void> {
    try {
      await this.db.run(
        'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        [taskId, 'working']
      );
    } catch (error) {
      console.error(`[TaskActivityUpdater] Error updating activity for task ${taskId}:`, error);
    }
  }
}