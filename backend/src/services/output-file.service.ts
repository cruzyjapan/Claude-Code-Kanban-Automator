import { getDatabase } from './database.service';

export interface OutputFile {
  id: string;
  task_id: string;
  execution_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: Date;
}

export class OutputFileService {
  async getByTaskId(taskId: string): Promise<OutputFile[]> {
    const sql = `
      SELECT * FROM output_files 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `;
    
    const results = await getDatabase().all(sql, [taskId]);
    return results as OutputFile[];
  }

  async getByExecutionId(executionId: string): Promise<OutputFile[]> {
    const sql = `
      SELECT * FROM output_files 
      WHERE execution_id = ? 
      ORDER BY created_at DESC
    `;
    
    const results = await getDatabase().all(sql, [executionId]);
    return results as OutputFile[];
  }
}