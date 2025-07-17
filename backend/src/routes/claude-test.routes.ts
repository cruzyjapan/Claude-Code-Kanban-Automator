import { Router } from 'express';
import { ClaudeTestController } from '../controllers/claude-test.controller';

const router = Router();
const claudeTestController = new ClaudeTestController();

router.post('/claude-code/test', (req, res) => claudeTestController.testConnection(req, res));

export default router;