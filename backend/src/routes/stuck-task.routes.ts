import { Router } from 'express';
import { StuckTaskDetectorService } from '../services/stuck-task-detector.service';

const router = Router();
let stuckTaskDetector: StuckTaskDetectorService;

export const setStuckTaskDetector = (detector: StuckTaskDetectorService) => {
  stuckTaskDetector = detector;
};

// Get all stuck tasks
router.get('/stuck-tasks', async (req, res) => {
  try {
    const stuckTasks = await stuckTaskDetector.getStuckTasks();
    res.json(stuckTasks);
  } catch (error: any) {
    console.error('Failed to get stuck tasks:', error);
    res.status(500).json({ error: 'Failed to get stuck tasks' });
  }
});

// Restart a stuck task
router.post('/tasks/:taskId/restart', async (req, res) => {
  try {
    const { taskId } = req.params;
    await stuckTaskDetector.restartStuckTask(taskId);
    res.json({ success: true, message: 'Task restarted successfully' });
  } catch (error: any) {
    console.error('Failed to restart task:', error);
    res.status(500).json({ error: error.message || 'Failed to restart task' });
  }
});

export default router;