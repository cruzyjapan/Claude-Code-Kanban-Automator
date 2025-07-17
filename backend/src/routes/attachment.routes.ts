import { Router } from 'express';
import multer from 'multer';
import { attachmentService } from '../services/attachment.service';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Upload attachment to a task
router.post('/tasks/:taskId/attachments', upload.single('file'), async (req, res): Promise<void> => {
  try {
    console.log('=== Attachment upload request received ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Task ID:', req.params.taskId);
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('Files in request:', req.files);
    
    const { taskId } = req.params;
    const file = req.file;
    
    if (!file) {
      console.error('No file in request. Check field name matches "file"');
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    
    const attachment = await attachmentService.uploadAttachment(
      taskId,
      file.originalname,
      file.buffer,
      file.mimetype,
      req.body.uploadedBy || 'default'
    );
    
    console.log('Attachment saved successfully:', attachment);
    res.json(attachment);
  } catch (error: any) {
    console.error('Failed to upload attachment - Full error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to upload attachment' });
  }
});

// Get attachments for a task
router.get('/tasks/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await attachmentService.getAttachmentsByTaskId(taskId);
    res.json(attachments);
  } catch (error: any) {
    console.error('Failed to get attachments:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

// Download attachment
router.get('/attachments/:id/download', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const attachment = await attachmentService.getAttachmentById(id);
    
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    
    // Check if file exists
    try {
      await fs.access(attachment.file_path);
    } catch {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }
    
    // Set headers for download
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    
    // Send file
    res.sendFile(path.resolve(attachment.file_path));
  } catch (error: any) {
    console.error('Failed to download attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// View attachment content (for images, PDFs, etc.)
router.get('/attachments/:id/view', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const attachment = await attachmentService.getAttachmentById(id);
    
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    
    // Check if file exists
    try {
      await fs.access(attachment.file_path);
    } catch {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }
    
    // Set content type for viewing
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    
    // For images and PDFs, display inline
    if (attachment.file_type?.startsWith('image/') || attachment.file_type === 'application/pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    }
    
    // Send file
    res.sendFile(path.resolve(attachment.file_path));
  } catch (error: any) {
    console.error('Failed to view attachment:', error);
    res.status(500).json({ error: 'Failed to view attachment' });
  }
});

// Delete attachment
router.delete('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await attachmentService.deleteAttachment(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;