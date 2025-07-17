import { getDatabase } from './database.service';
import { TaskService } from './task.service';
import { ExecutionService } from './execution.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';

export class StuckTaskRecoveryService {
  private db = getDatabase();
  private taskService = new TaskService();
  private executionService = new ExecutionService();
  private notificationService: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(wsService: WebSocketService) {
    this.notificationService = new NotificationService(wsService);
  }

  /**
   * Start monitoring for stuck tasks
   */
  startMonitoring(intervalMs: number = 60000): void {
    console.log(`[StuckTaskRecovery] Starting monitoring with interval: ${intervalMs}ms`);
    
    // Initial check
    this.checkAndRecoverStuckTasks();
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAndRecoverStuckTasks();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[StuckTaskRecovery] Monitoring stopped');
    }
  }

  /**
   * Check for stuck tasks and recover them
   */
  async checkAndRecoverStuckTasks(): Promise<void> {
    try {
      // Find tasks stuck in 'working' status
      const stuckTasks = await this.db.all(`
        SELECT 
          t.id,
          t.title,
          t.status,
          t.updated_at,
          ROUND((julianday('now', 'localtime') - julianday(t.updated_at)) * 24 * 60) as minutes_stuck
        FROM tasks t
        WHERE t.status = 'working'
          AND datetime(t.updated_at, '+5 minutes') < datetime('now', 'localtime')
        ORDER BY t.updated_at ASC
      `);

      if (stuckTasks.length === 0) {
        return;
      }

      console.log(`[StuckTaskRecovery] Found ${stuckTasks.length} stuck tasks`);

      for (const task of stuckTasks) {
        await this.recoverStuckTask(task);
      }

    } catch (error) {
      console.error('[StuckTaskRecovery] Error checking stuck tasks:', error);
    }
  }

  /**
   * Recover a single stuck task
   */
  private async recoverStuckTask(task: any): Promise<void> {
    console.log(`[StuckTaskRecovery] Recovering task ${task.id} - ${task.title} (stuck for ${task.minutes_stuck} minutes)`);

    try {
      // Find the running execution
      const runningExecution = await this.db.get(`
        SELECT id, retry_count
        FROM executions
        WHERE task_id = ?
          AND status = 'running'
        ORDER BY started_at DESC
        LIMIT 1
      `, [task.id]);

      if (runningExecution) {
        // Mark execution as failed
        await this.executionService.updateExecution(runningExecution.id, {
          status: 'failed',
          error_message: 'Task execution timed out',
          execution_logs: `Task was stuck in 'working' status for ${task.minutes_stuck} minutes and was automatically recovered`
        });

        // Check retry count
        if (runningExecution.retry_count < 3) {
          // Reset to requested for retry
          await this.taskService.updateTask(task.id, { status: 'requested' });
          console.log(`[StuckTaskRecovery] Task ${task.id} reset to 'requested' for retry`);
          
          await this.notificationService.createNotification({
            task_id: task.id,
            type: 'system_info',
            title: 'Task Recovered',
            message: `Task "${task.title}" was stuck and has been queued for retry`,
            priority: 'medium'
          });
        } else {
          // Max retries reached, reset to pending
          await this.taskService.updateTask(task.id, { status: 'pending' });
          console.log(`[StuckTaskRecovery] Task ${task.id} reset to 'pending' (max retries reached)`);
          
          await this.notificationService.notifyTaskError(
            task.id,
            task.title,
            'Task execution failed after maximum retries'
          );
        }
      } else {
        // No running execution found, just reset the task
        await this.taskService.updateTask(task.id, { status: 'pending' });
        console.log(`[StuckTaskRecovery] Task ${task.id} reset to 'pending' (no running execution found)`);
        
        await this.notificationService.createNotification({
          task_id: task.id,
          type: 'system_info',
          title: 'Task Recovered',
          message: `Task "${task.title}" was stuck without an active execution and has been reset`,
          priority: 'medium'
        });
      }

    } catch (error) {
      console.error(`[StuckTaskRecovery] Error recovering task ${task.id}:`, error);
    }
  }

  /**
   * Manually recover a specific task
   */
  async recoverTaskById(taskId: string): Promise<void> {
    const task = await this.taskService.getTaskById(taskId);
    
    if (task.status !== 'working') {
      throw new Error(`Task ${taskId} is not in 'working' status`);
    }

    await this.recoverStuckTask({
      id: task.id,
      title: task.title,
      status: task.status,
      updated_at: task.updated_at,
      minutes_stuck: Math.round((Date.now() - task.updated_at.getTime()) / 60000)
    });
  }

  /**
   * Get current stuck tasks
   */
  async getStuckTasks(): Promise<any[]> {
    return await this.db.all(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.updated_at,
        ROUND((julianday('now', 'localtime') - julianday(t.updated_at)) * 24 * 60) as minutes_stuck,
        (SELECT COUNT(*) FROM executions WHERE task_id = t.id AND status = 'running') as running_executions
      FROM tasks t
      WHERE t.status = 'working'
        AND datetime(t.updated_at, '+5 minutes') < datetime('now', 'localtime')
      ORDER BY t.updated_at ASC
    `);
  }
}