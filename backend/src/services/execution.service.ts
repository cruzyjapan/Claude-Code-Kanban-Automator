import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.service';
import { Execution, ExecutionStatus } from '../types';

export class ExecutionService {
  private db = getDatabase();

  async createExecution(taskId: string, version: number): Promise<Execution> {
    const id = `exec-${uuidv4()}`;
    
    const sql = `
      INSERT INTO executions (id, task_id, version, status, started_at)
      VALUES (?, ?, ?, 'running', datetime('now', 'localtime'))
    `;

    await this.db.run(sql, [id, taskId, version]);
    return this.getExecutionById(id);
  }

  async getExecutionById(id: string): Promise<Execution> {
    const execution = await this.db.get('SELECT * FROM executions WHERE id = ?', [id]);
    if (!execution) {
      throw new Error('Execution not found');
    }
    return this.formatExecution(execution);
  }

  async getTaskExecutions(taskId: string): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE task_id = ? 
      ORDER BY started_at DESC
    `;
    
    const executions = await this.db.all(sql, [taskId]);
    return executions.map(exec => this.formatExecution(exec));
  }

  async updateExecution(id: string, data: {
    status?: ExecutionStatus;
    output_path?: string;
    error_message?: string;
    execution_logs?: string;
  }): Promise<Execution> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
      
      if (data.status === 'completed' || data.status === 'failed') {
        updates.push("completed_at = datetime('now', 'localtime')");
      }
    }

    if (data.output_path !== undefined) {
      updates.push('output_path = ?');
      params.push(data.output_path);
    }

    if (data.error_message !== undefined) {
      updates.push('error_message = ?');
      params.push(data.error_message);
    }

    if (data.execution_logs !== undefined) {
      updates.push('execution_logs = ?');
      params.push(data.execution_logs);
    }

    if (updates.length === 0) {
      return this.getExecutionById(id);
    }

    params.push(id);
    const sql = `UPDATE executions SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.run(sql, params);

    return this.getExecutionById(id);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const sql = 'UPDATE executions SET retry_count = retry_count + 1 WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  async getRunningExecutions(): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE status = 'running' 
      ORDER BY started_at ASC
    `;
    
    const executions = await this.db.all(sql);
    return executions.map(exec => this.formatExecution(exec));
  }

  async getLatestExecution(taskId: string): Promise<Execution | null> {
    const sql = `
      SELECT * FROM executions 
      WHERE task_id = ? 
      ORDER BY started_at DESC 
      LIMIT 1
    `;
    
    const execution = await this.db.get(sql, [taskId]);
    return execution ? this.formatExecution(execution) : null;
  }

  private formatExecution(row: any): Execution {
    return {
      id: row.id,
      task_id: row.task_id,
      version: row.version,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status,
      output_path: row.output_path,
      error_message: row.error_message,
      execution_logs: row.execution_logs,
      retry_count: row.retry_count || 0
    };
  }
}