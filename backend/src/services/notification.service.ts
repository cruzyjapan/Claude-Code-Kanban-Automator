import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.service';
import { Notification, NotificationType, TaskPriority } from '../types';
import { WebSocketService } from './websocket.service';

export class NotificationService {
  private db = getDatabase();
  private wsService: WebSocketService;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  async createNotification(data: {
    user_id?: string;
    task_id?: string;
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    priority?: TaskPriority;
  }): Promise<Notification> {
    const id = `notif-${uuidv4()}`;
    
    const sql = `
      INSERT INTO notifications (id, user_id, task_id, type, title, message, action_url, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      data.user_id || 'default',
      data.task_id || null,
      data.type,
      data.title,
      data.message,
      data.action_url || null,
      data.priority || 'medium'
    ]);

    const notification = await this.getNotificationById(id);

    // Send WebSocket notification
    this.wsService.broadcast({
      type: 'notification',
      data: notification
    });

    return notification;
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = await this.db.get('SELECT * FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return this.formatNotification(notification);
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const notifications = await this.db.all(sql, params);
    return notifications.map(n => this.formatNotification(n));
  }

  async markAsRead(id: string): Promise<void> {
    await this.db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    // Mark all unread notifications as read
    await this.db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
    
    // Delete all read notifications
    await this.db.run('DELETE FROM notifications WHERE user_id = ? AND is_read = 1', [userId]);
  }

  async deleteNotification(id: string): Promise<void> {
    await this.db.run('DELETE FROM notifications WHERE id = ?', [id]);
  }

  async deleteOldNotifications(daysToKeep: number = 7): Promise<void> {
    const sql = `
      DELETE FROM notifications 
      WHERE created_at < datetime('now', '-${daysToKeep} days')
    `;
    await this.db.run(sql);
  }

  async notifyTaskStatusChange(taskId: string, taskTitle: string, oldStatus: string, newStatus: string): Promise<void> {
    let type: NotificationType;
    let title: string;
    let message: string;

    // Send WebSocket task update event
    this.wsService.broadcast({
      type: 'task_update',
      data: {
        taskId,
        task: { id: taskId, title: taskTitle, status: newStatus },
        previousStatus: oldStatus,
        newStatus
      }
    });

    switch (newStatus) {
      case 'working':
        type = 'task_start';
        title = 'notification.task.started.title';
        message = `notification.task.started.message|${taskTitle}`;
        break;
      case 'review':
        type = 'review_request';
        title = 'notification.task.review.title';
        message = `notification.task.review.message|${taskTitle}`;
        break;
      case 'completed':
        type = 'task_complete';
        title = 'notification.task.completed.title';
        message = `notification.task.completed.message|${taskTitle}`;
        break;
      default:
        return;
    }

    await this.createNotification({
      task_id: taskId,
      type,
      title,
      message,
      action_url: `/tasks/${taskId}`,
      priority: newStatus === 'review' ? 'high' : 'medium'
    });
  }

  async notifyTaskError(taskId: string, taskTitle: string, error: string): Promise<void> {
    await this.createNotification({
      task_id: taskId,
      type: 'task_error',
      title: 'notification.task.error.title',
      message: `notification.task.error.message|${taskTitle}|${error}`,
      action_url: `/tasks/${taskId}`,
      priority: 'high'
    });
  }

  async notifyFeedbackComplete(taskId: string, taskTitle: string): Promise<void> {
    await this.createNotification({
      task_id: taskId,
      type: 'feedback_complete',
      title: 'notification.feedback.completed.title',
      message: `notification.feedback.completed.message|${taskTitle}`,
      action_url: `/tasks/${taskId}`,
      priority: 'high'
    });
  }

  private formatNotification(row: any): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      task_id: row.task_id,
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: Boolean(row.is_read),
      created_at: new Date(row.created_at + 'Z'),
      action_url: row.action_url,
      priority: row.priority
    };
  }
}