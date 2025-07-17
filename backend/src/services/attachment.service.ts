import { DatabaseService, getDatabase } from './database.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { config } from 'dotenv';

config();

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: Date;
  uploaded_by?: string;
}

export class AttachmentService {
  private db: DatabaseService;
  private uploadDir: string;

  constructor() {
    this.db = getDatabase();
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('Upload directory ensured at:', this.uploadDir);
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async uploadAttachment(
    taskId: string,
    fileName: string,
    fileBuffer: Buffer,
    fileType?: string,
    uploadedBy?: string
  ): Promise<TaskAttachment> {
    const id = uuidv4();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(this.uploadDir, taskId, `${id}_${sanitizedFileName}`);
    
    // Create task-specific directory
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save file to disk
    await fs.writeFile(filePath, fileBuffer);
    
    // Get file size
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    // Save to database
    const sql = `
      INSERT INTO task_attachments (id, task_id, file_path, file_name, file_type, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.run(sql, [id, taskId, filePath, fileName, fileType, fileSize, uploadedBy]);
    
    return {
      id,
      task_id: taskId,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      uploaded_at: new Date(),
      uploaded_by: uploadedBy
    };
  }

  async getAttachmentsByTaskId(taskId: string): Promise<TaskAttachment[]> {
    const sql = `
      SELECT * FROM task_attachments
      WHERE task_id = ?
      ORDER BY uploaded_at DESC
    `;
    
    const attachments = await this.db.all(sql, [taskId]);
    
    return attachments.map(att => ({
      ...att,
      uploaded_at: new Date(att.uploaded_at + 'Z')
    }));
  }

  async getAttachmentById(id: string): Promise<TaskAttachment | null> {
    const sql = 'SELECT * FROM task_attachments WHERE id = ?';
    const attachment = await this.db.get(sql, [id]);
    
    if (!attachment) {
      return null;
    }
    
    return {
      ...attachment,
      uploaded_at: new Date(attachment.uploaded_at + 'Z')
    };
  }

  async deleteAttachment(id: string): Promise<void> {
    // Get attachment info first
    const attachment = await this.getAttachmentById(id);
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    
    // Delete file from disk
    try {
      await fs.unlink(attachment.file_path);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
    }
    
    // Delete from database
    const sql = 'DELETE FROM task_attachments WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  async deleteAttachmentsByTaskId(taskId: string): Promise<void> {
    const attachments = await this.getAttachmentsByTaskId(taskId);
    
    // Delete all files
    for (const attachment of attachments) {
      try {
        await fs.unlink(attachment.file_path);
      } catch (error) {
        console.error(`Failed to delete file ${attachment.file_path}:`, error);
      }
    }
    
    // Delete from database
    const sql = 'DELETE FROM task_attachments WHERE task_id = ?';
    await this.db.run(sql, [taskId]);
  }

  async getAttachmentFilePath(id: string): Promise<string | null> {
    const attachment = await this.getAttachmentById(id);
    return attachment ? attachment.file_path : null;
  }
}

export const attachmentService = new AttachmentService();