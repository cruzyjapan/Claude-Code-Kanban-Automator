import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.service';
import { Feedback, CreateFeedbackDto } from '../types';

export class FeedbackService {
  private db = getDatabase();

  async createFeedback(taskId: string, data: CreateFeedbackDto): Promise<Feedback> {
    const id = `fb-${uuidv4()}`;
    
    const sql = `
      INSERT INTO feedback (id, task_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      taskId,
      data.user_id || 'default',
      data.content
    ]);

    return this.getFeedbackById(id);
  }

  async getFeedbackById(id: string): Promise<Feedback> {
    const feedback = await this.db.get('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!feedback) {
      throw new Error('Feedback not found');
    }
    return this.formatFeedback(feedback);
  }

  async getTaskFeedback(taskId: string): Promise<Feedback[]> {
    const sql = `
      SELECT * FROM feedback 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `;
    
    const feedbacks = await this.db.all(sql, [taskId]);
    return feedbacks.map(fb => this.formatFeedback(fb));
  }

  async getUnaddressedFeedback(taskId: string): Promise<Feedback[]> {
    const sql = `
      SELECT * FROM feedback 
      WHERE task_id = ? AND addressed = 0
      ORDER BY created_at ASC
    `;
    
    const feedbacks = await this.db.all(sql, [taskId]);
    return feedbacks.map(fb => this.formatFeedback(fb));
  }

  async markFeedbackAsAddressed(id: string, version: number): Promise<void> {
    const sql = `
      UPDATE feedback 
      SET addressed = 1, addressed_version = ?
      WHERE id = ?
    `;
    
    await this.db.run(sql, [version, id]);
  }

  async markTaskFeedbackAsAddressed(taskId: string, version: number): Promise<void> {
    const sql = `
      UPDATE feedback 
      SET addressed = 1, addressed_version = ?
      WHERE task_id = ? AND addressed = 0
    `;
    
    await this.db.run(sql, [version, taskId]);
  }

  async deleteFeedback(id: string): Promise<void> {
    await this.db.run('DELETE FROM feedback WHERE id = ?', [id]);
  }

  private formatFeedback(row: any): Feedback {
    return {
      id: row.id,
      task_id: row.task_id,
      user_id: row.user_id,
      content: row.content,
      created_at: new Date(row.created_at + 'Z'),
      addressed: Boolean(row.addressed),
      addressed_version: row.addressed_version
    };
  }
}