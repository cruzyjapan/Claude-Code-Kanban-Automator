import { Router } from 'express';
import { OutputFileService } from '../services/output-file.service';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

const router = Router();
const outputFileService = new OutputFileService();

// Get output files by task ID
router.get('/tasks/:taskId/output-files', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(`Fetching output files for task ${taskId}`);
    const files = await outputFileService.getByTaskId(taskId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching output files:', error);
    res.status(500).json({ error: 'Failed to fetch output files' });
  }
});

// Get output files by execution ID
router.get('/executions/:executionId/output-files', async (req, res) => {
  try {
    const { executionId } = req.params;
    console.log(`Fetching output files for execution ${executionId}`);
    const files = await outputFileService.getByExecutionId(executionId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching output files:', error);
    res.status(500).json({ error: 'Failed to fetch output files' });
  }
});

// Download file with improved error handling
router.get('/output-files/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`Download request for file ID: ${fileId}`);
    
    // Get file info from database by ID
    const db = await import('../services/database.service').then(m => m.getDatabase());
    const sql = 'SELECT * FROM output_files WHERE id = ?';
    const fileInfo = await db.get(sql, [fileId]);
    
    if (!fileInfo) {
      console.error(`File not found in database: ${fileId}`);
      return res.status(404).json({ error: 'File not found in database' });
    }
    
    console.log(`File found: ${fileInfo.file_name} at ${fileInfo.file_path}`);
    
    // Check if file exists
    try {
      await fs.access(fileInfo.file_path);
      console.log('File exists on disk');
    } catch (err) {
      console.error(`File not found on disk: ${fileInfo.file_path}`, err);
      return res.status(404).json({ 
        error: 'File not found on disk',
        path: fileInfo.file_path 
      });
    }
    
    // Set proper headers for download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.file_name}"`);
    
    // Send file for download with error callback
    return res.download(fileInfo.file_path, fileInfo.file_name, (err) => {
      if (err) {
        console.error('Error during file download:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      } else {
        console.log(`File downloaded successfully: ${fileInfo.file_name}`);
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in download route:', error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to download file',
        message: error.message 
      });
    }
  }
});

// Get file content with improved error handling
router.get('/output-files/:fileId/content', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`Content request for file ID: ${fileId}`);
    
    // Get file info from database by ID
    const db = await import('../services/database.service').then(m => m.getDatabase());
    const sql = 'SELECT * FROM output_files WHERE id = ?';
    const fileInfo = await db.get(sql, [fileId]);
    
    if (!fileInfo) {
      console.error(`File not found in database: ${fileId}`);
      return res.status(404).json({ error: 'File not found in database' });
    }
    
    console.log(`Reading file: ${fileInfo.file_path}`);
    
    // Read file content
    try {
      const content = await fs.readFile(fileInfo.file_path, 'utf8');
      console.log(`File read successfully, size: ${content.length} bytes`);
      
      return res.json({ 
        content,
        file_name: fileInfo.file_name,
        file_type: fileInfo.file_type,
        file_path: fileInfo.file_path
      });
    } catch (err: any) {
      console.error('Error reading file:', err);
      return res.status(404).json({ 
        error: 'File not found on disk',
        path: fileInfo.file_path,
        message: err.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in content route:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch file content',
      message: error.message
    });
  }
});

// Bulk download files as zip
router.get('/tasks/:taskId/download-all', async (req, res): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { files } = req.query;
    
    console.log(`Bulk download request for task ${taskId}, files: ${files}`);
    
    // Get file info from database
    const db = await import('../services/database.service').then(m => m.getDatabase());
    let fileInfos;
    
    if (files && typeof files === 'string') {
      // Download specific files
      const fileIds = files.split(',');
      const placeholders = fileIds.map(() => '?').join(',');
      const sql = `SELECT * FROM output_files WHERE id IN (${placeholders}) AND task_id = ?`;
      fileInfos = await db.all(sql, [...fileIds, taskId]);
    } else {
      // Download all files for the task
      const sql = 'SELECT * FROM output_files WHERE task_id = ?';
      fileInfos = await db.all(sql, [taskId]);
    }
    
    if (!fileInfos || fileInfos.length === 0) {
      res.status(404).json({ error: 'No files found' });
      return;
    }
    
    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' });
      }
    });
    
    // Set headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="task-${taskId}-files.zip"`);
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Add files to archive
    for (const file of fileInfos) {
      try {
        await fs.access(file.file_path);
        archive.file(file.file_path, { name: file.file_name });
      } catch (err) {
        console.error(`Skipping missing file: ${file.file_path}`);
      }
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error: any) {
    console.error('Error creating zip archive:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create download archive' });
    }
  }
});

// Test endpoint to verify routes are working
router.get('/output-files/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ 
    message: 'Output file routes are working',
    endpoints: [
      'GET /api/tasks/:taskId/output-files',
      'GET /api/executions/:executionId/output-files',
      'GET /api/output-files/:fileId/download',
      'GET /api/output-files/:fileId/content',
      'GET /api/tasks/:taskId/download-all'
    ]
  });
});

export default router;