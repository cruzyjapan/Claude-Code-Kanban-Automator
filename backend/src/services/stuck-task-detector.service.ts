import { DatabaseService, getDatabase } from './database.service';
import { TaskService } from './task.service';
import { ExecutionService } from './execution.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { SettingsService } from './settings.service';

export class StuckTaskDetectorService {
  private db: DatabaseService;
  private taskService: TaskService;
  private executionService: ExecutionService;
  private notificationService: NotificationService;
  private settingsService: SettingsService;
  private wsService: WebSocketService | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    taskService: TaskService,
    executionService: ExecutionService,
    notificationService: NotificationService,
    settingsService: SettingsService
  ) {
    this.db = getDatabase();
    this.taskService = taskService;
    this.executionService = executionService;
    this.notificationService = notificationService;
    this.settingsService = settingsService;
  }

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  start(): void {
    console.log('Starting stuck task detector...');
    
    // Check every 2 minutes
    this.checkInterval = setInterval(() => {
      this.checkStuckTasks().catch(console.error);
    }, 2 * 60 * 1000);
    
    // Initial check
    this.checkStuckTasks().catch(console.error);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Stopped stuck task detector');
  }

  private async checkStuckTasks(): Promise<void> {
    try {
      // Get user settings for timeout configuration
      const settings = await this.settingsService.getSettings('default');
      
      // Skip if timeout is disabled
      if (!settings.enable_task_timeout) {
        return;
      }
      
      const timeoutMinutes = settings.task_timeout_minutes;
      
      // Find running executions that haven't been updated recently
      const sql = `
        SELECT e.*, t.title 
        FROM executions e
        JOIN tasks t ON e.task_id = t.id
        WHERE e.status = 'running' 
        AND datetime(e.started_at, '+${timeoutMinutes} minutes') < datetime('now')
        AND (
          e.last_activity_at IS NULL 
          OR datetime(e.last_activity_at, '+${timeoutMinutes} minutes') < datetime('now')
        )
      `;

      const stuckExecutions = await this.db.all(sql);
      
      for (const execution of stuckExecutions) {
        console.log(`Detected stuck task: ${execution.task_id} - ${execution.title}`);
        
        // Automatically reset the task
        try {
          // Get timeout setting for error message
          const settings = await this.settingsService.getSettings('default');
          const timeoutMinutes = settings.task_timeout_minutes;
          
          // Mark current execution as failed
          await this.executionService.updateExecution(execution.id, {
            status: 'failed',
            error_message: `Task execution stuck for more than ${timeoutMinutes} minutes - automatically reset`
          });

          // Update task status back to pending
          await this.taskService.updateTask(execution.task_id, { status: 'pending' });
          
          // Notify user about automatic reset
          await this.notificationService.createNotification({
            user_id: 'default',
            task_id: execution.task_id,
            type: 'system_info',
            title: 'notification.task.auto.reset.title',
            message: `notification.task.auto.reset.message|${execution.title}|${timeoutMinutes}`,
            priority: 'high'
          });

          console.log(`Automatically reset stuck task: ${execution.task_id}`);

          // Broadcast stuck task event
          if (this.wsService) {
            this.wsService.broadcast({
              type: 'task_auto_reset',
              data: {
                taskId: execution.task_id,
                executionId: execution.id,
                title: execution.title,
                newStatus: 'pending'
              }
            });
          }
        } catch (resetError) {
          console.error(`Failed to reset stuck task ${execution.task_id}:`, resetError);
          
          // If reset fails, still notify user about the stuck task
          await this.notificationService.createNotification({
            user_id: 'default',
            task_id: execution.task_id,
            type: 'task_error',
            title: 'タスクが停止しています',
            message: `タスク「${execution.title}」の実行が${timeoutMinutes}分以上停止しています。`,
            priority: 'high'
          });
        }
      }

      if (stuckExecutions.length > 0) {
        console.log(`Found and processed ${stuckExecutions.length} stuck tasks`);
      }
    } catch (error) {
      console.error('Error checking stuck tasks:', error);
    }
  }

  async restartStuckTask(taskId: string): Promise<void> {
    console.log(`Attempting to restart stuck task: ${taskId}`);
    
    try {
      // Get current execution
      const currentExecution = await this.db.get(
        'SELECT * FROM executions WHERE task_id = ? AND status = "running" ORDER BY started_at DESC LIMIT 1',
        [taskId]
      );

      if (!currentExecution) {
        throw new Error('No running execution found for task');
      }

      // Mark current execution as failed
      await this.executionService.updateExecution(currentExecution.id, {
        status: 'failed',
        error_message: 'Task was stuck and manually restarted'
      });

      // Update task status back to requested
      await this.taskService.updateTask(taskId, { status: 'requested' });

      // Notify user
      await this.notificationService.createNotification({
        user_id: 'default',
        task_id: taskId,
        type: 'task_start',
        title: 'タスクを再開しました',
        message: 'スタックしていたタスクを再開しました。',
        priority: 'medium'
      });

      console.log(`Successfully restarted task: ${taskId}`);
    } catch (error) {
      console.error(`Failed to restart task ${taskId}:`, error);
      throw error;
    }
  }

  async getStuckTasks(): Promise<any[]> {
    // Get user settings for timeout configuration
    const settings = await this.settingsService.getSettings('default');
    
    // Skip if timeout is disabled
    if (!settings.enable_task_timeout) {
      return [];
    }
    
    const timeoutMinutes = settings.task_timeout_minutes;
    
    const sql = `
      SELECT e.*, t.title, t.priority,
        CASE 
          WHEN e.last_activity_at IS NOT NULL 
          THEN (julianday('now') - julianday(e.last_activity_at)) * 24 * 60
          ELSE (julianday('now') - julianday(e.started_at)) * 24 * 60
        END as minutes_stuck
      FROM executions e
      JOIN tasks t ON e.task_id = t.id
      WHERE e.status = 'running' 
      AND datetime(e.started_at, '+${timeoutMinutes} minutes') < datetime('now')
      AND (
        e.last_activity_at IS NULL 
        OR datetime(e.last_activity_at, '+${timeoutMinutes} minutes') < datetime('now')
      )
      ORDER BY minutes_stuck DESC
    `;

    return await this.db.all(sql);
  }
}

export const createStuckTaskDetector = (
  taskService: TaskService,
  executionService: ExecutionService,
  notificationService: NotificationService,
  settingsService: SettingsService
): StuckTaskDetectorService => {
  return new StuckTaskDetectorService(taskService, executionService, notificationService, settingsService);
};