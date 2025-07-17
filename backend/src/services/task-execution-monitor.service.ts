import { ClaudeCodeExecutor } from './claude-code-executor.service';
import { TaskService } from './task.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { Task } from '../types';

export class TaskExecutionMonitor {
  private executor: ClaudeCodeExecutor;
  private taskService: TaskService;
  private checkInterval: number;
  private maxConcurrentTasks: number;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    executor: ClaudeCodeExecutor,
    taskService: TaskService,
    checkInterval: number,
    maxConcurrentTasks: number
  ) {
    this.executor = executor;
    this.taskService = taskService;
    this.checkInterval = checkInterval;
    this.maxConcurrentTasks = maxConcurrentTasks;
  }

  start(): void {
    if (this.isRunning) {
      console.log('Task execution monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting task execution monitor...');
    
    // Initial check
    this.checkAndExecuteTasks();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkAndExecuteTasks();
    }, this.checkInterval);

    console.log(`Task execution monitor started (interval: ${this.checkInterval}ms)`);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Task execution monitor stopped');
  }

  private async checkAndExecuteTasks(): Promise<void> {
    try {
      const runningCount = this.executor.getRunningTaskCount();
      
      if (runningCount >= this.maxConcurrentTasks) {
        console.log(`Max concurrent tasks reached (${runningCount}/${this.maxConcurrentTasks})`);
        return;
      }

      // Get tasks in 'requested' status
      const requestedTasks = await this.taskService.getTasksByStatus('requested');
      
      if (requestedTasks.length === 0) {
        return;
      }

      // Sort by priority and position
      const sortedTasks = this.sortTasksByPriority(requestedTasks);
      
      // Calculate how many tasks we can run
      const tasksToRun = Math.min(
        sortedTasks.length,
        this.maxConcurrentTasks - runningCount
      );

      console.log(`[TaskMonitor] Found ${requestedTasks.length} requested tasks, running ${tasksToRun} (${runningCount} currently running)`);

      // Execute tasks
      for (let i = 0; i < tasksToRun; i++) {
        const task = sortedTasks[i];
        console.log(`[TaskMonitor] Starting execution of task: ${task.id} - ${task.title}`);
        
        // Execute task asynchronously
        this.executor.executeTask(task).catch(error => {
          console.error(`[TaskMonitor] Error executing task ${task.id}:`, error);
        });
      }

    } catch (error) {
      console.error('[TaskMonitor] Error in task execution monitor:', error);
    }
  }

  private sortTasksByPriority(tasks: Task[]): Task[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return tasks.sort((a, b) => {
      // First, check if any task has feedback (higher priority)
      const aHasFeedback = a.version > 1;
      const bHasFeedback = b.version > 1;
      
      if (aHasFeedback && !bHasFeedback) return -1;
      if (!aHasFeedback && bHasFeedback) return 1;
      
      // Then sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally, sort by creation date (FIFO)
      return a.created_at.getTime() - b.created_at.getTime();
    });
  }

  async executeTaskById(taskId: string): Promise<void> {
    const task = await this.taskService.getTaskById(taskId);
    
    if (task.status !== 'requested') {
      throw new Error(`Task ${taskId} is not in 'requested' status`);
    }

    const runningCount = this.executor.getRunningTaskCount();
    if (runningCount >= this.maxConcurrentTasks) {
      throw new Error('Max concurrent tasks reached');
    }

    await this.executor.executeTask(task);
  }

  getStatus(): {
    isRunning: boolean;
    runningTasks: number;
    maxConcurrentTasks: number;
    checkInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      runningTasks: this.executor.getRunningTaskCount(),
      maxConcurrentTasks: this.maxConcurrentTasks,
      checkInterval: this.checkInterval
    };
  }
}