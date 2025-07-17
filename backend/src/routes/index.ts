import { Router } from 'express';
import taskRoutes from './task.routes';
import executionRoutes from './execution.routes';
import feedbackRoutes from './feedback.routes';
import notificationRoutes from './notification.routes';
import outputFileRoutes from './output-file.routes';
import settingsRoutes from './settings.routes';
import attachmentRoutes from './attachment.routes';
import stuckTaskRoutes from './stuck-task.routes';
import claudeTestRoutes from './claude-test.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    websocket_clients: 0 // TODO: Get actual count if needed
  });
});

// Mount routes
router.use(taskRoutes);
router.use(executionRoutes);
router.use(feedbackRoutes);
router.use(notificationRoutes);
router.use(outputFileRoutes);
router.use(settingsRoutes);
router.use(attachmentRoutes);
router.use(stuckTaskRoutes);
router.use(claudeTestRoutes);

export default router;