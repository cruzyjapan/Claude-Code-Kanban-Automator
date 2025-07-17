import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.service';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskQueue } from '../types';
import { WebSocketService } from './websocket.service';
import { sqliteToDate } from '../utils/date-utils';

export class TaskService {
  private db = getDatabase();
  private wsService: WebSocketService | null = null;
  
  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  async createTask(data: CreateTaskDto): Promise<Task> {
    const id = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const sql = `
      INSERT INTO tasks (id, title, description, priority, due_date, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      data.title,
      data.description || null,
      data.priority || 'medium',
      data.due_date || null,
      data.estimated_hours || null
    ]);

    // Add to task queue if status is 'pending'
    await this.addToQueue(id, 'pending');

    // Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      await this.addTagsToTask(id, data.tags);
    }

    return this.getTaskById(id);
  }

  async getTaskById(id: string, includeArchived: boolean = false): Promise<Task> {
    const sql = includeArchived
      ? `SELECT t.*, 
         (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id) as attachment_count
         FROM tasks t WHERE t.id = ?`
      : `SELECT t.*,
         (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id) as attachment_count
         FROM tasks t WHERE t.id = ? AND t.is_deleted = 0`;
    
    const task = await this.db.get(sql, [id]);
    if (!task) {
      throw new Error('Task not found');
    }
    
    return this.formatTask(task);
  }

  async getAllTasks(filters?: {
    status?: TaskStatus;
    priority?: string;
    search?: string;
  }): Promise<Task[]> {
    let sql = `
      SELECT t.*, q.position,
        (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id) as attachment_count
      FROM tasks t 
      LEFT JOIN task_queue q ON t.id = q.task_id AND q.status = t.status
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters?.priority) {
      sql += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters?.search) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    sql += ' ORDER BY t.updated_at DESC, t.created_at DESC';

    const tasks = await this.db.all(sql, params);
    return tasks.map(task => this.formatTask(task));
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    console.log('TaskService.updateTask called with:', { id, data });
    
    // Get current task for comparison
    const currentTask = await this.getTaskById(id);
    
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(data.due_date);
    }

    if (data.estimated_hours !== undefined) {
      updates.push('estimated_hours = ?');
      params.push(data.estimated_hours);
    }

    if (updates.length === 0) {
      return this.getTaskById(id);
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    params.push(id);
    const sql = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `;

    console.log('Executing SQL:', sql);
    console.log('With params:', params);
    
    try {
      await this.db.run(sql, params);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Update task queue if status changed
    if (data.status !== undefined) {
      await this.updateTaskQueueStatus(id, data.status);
    }

    // Handle tags if provided
    if (data.tags) {
      await this.updateTaskTags(id, data.tags);
    }

    const updatedTask = await this.getTaskById(id);
    
    // Broadcast task update via WebSocket
    if (this.wsService && data.status !== undefined) {
      this.wsService.broadcastTaskUpdate(id, {
        task: updatedTask,
        previousStatus: currentTask?.status,
        newStatus: data.status
      });
    }
    
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const sql = 'UPDATE tasks SET is_deleted = 1 WHERE id = ?';
    await this.db.run(sql, [id]);
    
    // Remove from queue
    await this.removeFromQueue(id);
  }

  async incrementTaskVersion(id: string): Promise<void> {
    const sql = `
      UPDATE tasks 
      SET version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `;
    
    console.log('Incrementing task version for:', id);
    await this.db.run(sql, [id]);
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const sql = `
      SELECT t.*, q.position 
      FROM tasks t
      LEFT JOIN task_queue q ON t.id = q.task_id AND q.status = t.status
      WHERE t.status = ? AND t.is_deleted = 0
      ORDER BY q.position ASC, t.priority DESC, t.created_at ASC
    `;

    const tasks = await this.db.all(sql, [status]);
    return tasks.map(task => this.formatTask(task));
  }

  async getTaskQueue(status: string): Promise<TaskQueue[]> {
    const sql = `
      SELECT tq.*, t.title, t.priority 
      FROM task_queue tq
      JOIN tasks t ON tq.task_id = t.id
      WHERE tq.status = ? AND t.is_deleted = 0
      ORDER BY tq.position ASC
    `;

    return await this.db.all(sql, [status]);
  }

  async updateTaskQueue(status: string, tasks: Array<{ task_id: string; position: number }>): Promise<void> {
    await this.db.transaction(async () => {
      // Clear existing positions for this status
      await this.db.run('DELETE FROM task_queue WHERE status = ?', [status]);

      // Insert new positions only for existing tasks
      const stmt = `INSERT INTO task_queue (task_id, status, position) 
                    SELECT ?, ?, ? 
                    WHERE EXISTS (SELECT 1 FROM tasks WHERE id = ? AND is_deleted = 0)`;
      for (const task of tasks) {
        await this.db.run(stmt, [task.task_id, status, task.position, task.task_id]);
      }
    });
  }

  private async addToQueue(taskId: string, status: string): Promise<void> {
    const sql = `
      INSERT INTO task_queue (task_id, status, position)
      SELECT ?, ?, COALESCE(MAX(position), 0) + 1
      FROM task_queue
      WHERE status = ?
    `;

    await this.db.run(sql, [taskId, status, status]);
  }

  private async updateTaskQueueStatus(taskId: string, newStatus: string): Promise<void> {
    // Remove from old queue
    await this.db.run('DELETE FROM task_queue WHERE task_id = ?', [taskId]);
    
    // Add to new queue
    if (newStatus !== 'completed') {
      await this.addToQueue(taskId, newStatus);
    }
  }

  private async removeFromQueue(taskId: string): Promise<void> {
    try {
      console.log('Removing task from queue:', taskId);
      const result = await this.db.run('DELETE FROM task_queue WHERE task_id = ?', [taskId]);
      console.log('Remove from queue result:', result);
    } catch (error) {
      console.error('Error removing task from queue:', error);
      // Don't throw error, as this is not critical for archiving
    }
  }

  private async addTagsToTask(taskId: string, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      // Get or create tag
      let tag = await this.db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
      
      if (!tag) {
        const tagId = `tag-${tagName}`;
        await this.db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [tagId, tagName]);
        tag = { id: tagId };
      }

      // Link tag to task
      await this.db.run('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tag.id]);
    }
  }

  private async updateTaskTags(taskId: string, tagNames: string[]): Promise<void> {
    // Remove existing tags
    await this.db.run('DELETE FROM task_tags WHERE task_id = ?', [taskId]);
    
    // Add new tags
    if (tagNames.length > 0) {
      await this.addTagsToTask(taskId, tagNames);
    }
  }

  async getTaskTags(taskId: string): Promise<string[]> {
    const sql = `
      SELECT t.name 
      FROM tags t
      JOIN task_tags tt ON t.id = tt.tag_id
      WHERE tt.task_id = ?
    `;

    const tags = await this.db.all(sql, [taskId]);
    return tags.map(tag => tag.name);
  }

  private formatTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      due_date: sqliteToDate(row.due_date),
      created_at: sqliteToDate(row.created_at)!,
      updated_at: sqliteToDate(row.updated_at)!,
      version: row.version,
      estimated_hours: row.estimated_hours,
      actual_hours: row.actual_hours,
      assigned_ai: row.assigned_ai,
      is_deleted: Boolean(row.is_deleted),
      attachment_count: row.attachment_count || 0
    };
  }

  async archiveTask(id: string): Promise<void> {
    try {
      console.log('TaskService.archiveTask called with id:', id);
      
      // First check if task exists
      const existingTask = await this.db.get('SELECT id FROM tasks WHERE id = ? AND is_deleted = 0', [id]);
      
      if (!existingTask) {
        throw new Error('Task not found or already archived');
      }
      
      // Set is_deleted to 1 (soft delete)
      const sql = 'UPDATE tasks SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0';
      const result = await this.db.run(sql, [id]);
      
      console.log('Archive UPDATE result:', result);
      
      // Remove from queue
      console.log('Removing from queue:', id);
      await this.removeFromQueue(id);
      console.log('Task archived successfully:', id);
    } catch (error) {
      console.error('Error in TaskService.archiveTask:', error);
      throw error;
    }
  }

  async getArchivedTasks(): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE is_deleted = 1 
      ORDER BY updated_at DESC
    `;
    
    const tasks = await this.db.all(sql);
    return tasks.map(task => this.formatTask(task));
  }

  async permanentlyDeleteTask(id: string): Promise<void> {
    // Check if task is archived
    const task = await this.db.get('SELECT * FROM tasks WHERE id = ? AND is_deleted = 1', [id]);
    if (!task) {
      throw new Error('Task not found in archive');
    }
    
    // Use transaction method for cascading deletes
    await this.db.transaction(async () => {
      // Delete related records in the correct order to avoid foreign key constraints
      await this.db.run('DELETE FROM output_files WHERE task_id = ?', [id]);
      await this.db.run('DELETE FROM notifications WHERE task_id = ?', [id]);
      await this.db.run('DELETE FROM feedback WHERE task_id = ?', [id]);
      await this.db.run('DELETE FROM executions WHERE task_id = ?', [id]);
      await this.db.run('DELETE FROM task_tags WHERE task_id = ?', [id]);
      await this.db.run('DELETE FROM task_queue WHERE task_id = ?', [id]);
      
      // Finally delete the task
      await this.db.run('DELETE FROM tasks WHERE id = ?', [id]);
    });
  }

  async markAsViewed(taskId: string, userId: string = 'default'): Promise<void> {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    // Insert or update the view record
    const sql = `
      INSERT INTO task_views (id, task_id, user_id, viewed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(task_id, user_id) 
      DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.run(sql, [id, taskId, userId]);
  }

  async getLastViewedTime(taskId: string, userId: string = 'default'): Promise<Date | null> {
    const sql = `
      SELECT viewed_at FROM task_views
      WHERE task_id = ? AND user_id = ?
    `;
    
    const result = await this.db.get(sql, [taskId, userId]);
    return result ? new Date(result.viewed_at + 'Z') : null;
  }

  async forceCleanup(): Promise<{ resetCount: number; message: string }> {
    try {
      // Get all tasks that are stuck in working status
      const stuckTasks = await this.db.all(`
        SELECT id, title FROM tasks 
        WHERE status = 'working' AND is_deleted = 0
      `);

      if (stuckTasks.length === 0) {
        return { resetCount: 0, message: 'No stuck tasks found' };
      }

      // Update all stuck tasks to pending status
      const updateResult = await this.db.run(`
        UPDATE tasks 
        SET status = 'pending', updated_at = CURRENT_TIMESTAMP 
        WHERE status = 'working' AND is_deleted = 0
      `);

      // Update any running executions to failed status
      await this.db.run(`
        UPDATE executions 
        SET status = 'failed', 
            completed_at = CURRENT_TIMESTAMP,
            error_message = 'Force cleanup: Task was stuck and reset to pending'
        WHERE status = 'running' AND task_id IN (
          SELECT id FROM tasks WHERE status = 'pending' AND is_deleted = 0
        )
      `);

      // Remove tasks from queue if they exist
      for (const task of stuckTasks) {
        await this.db.run(`
          DELETE FROM task_queue WHERE task_id = ?
        `, [task.id]);
      }

      console.log(`Force cleanup completed: ${stuckTasks.length} tasks reset to pending`);
      
      return { 
        resetCount: stuckTasks.length, 
        message: `Successfully reset ${stuckTasks.length} stuck tasks to pending status` 
      };
    } catch (error) {
      console.error('Error during force cleanup:', error);
      throw new Error('Failed to perform force cleanup');
    }
  }
}