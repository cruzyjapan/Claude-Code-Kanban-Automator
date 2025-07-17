import { Router } from 'express';
import { param } from 'express-validator';
import { ExecutionController } from '../controllers/execution.controller';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const executionController = new ExecutionController();

// Validation
const taskIdValidation = [
  param('taskId').notEmpty(),
  validateRequest
];

const executionIdValidation = [
  param('id').notEmpty(),
  validateRequest
];

// Routes
router.get('/tasks/:taskId/executions', taskIdValidation, (req, res, next) => 
  executionController.getTaskExecutions(req, res, next)
);

router.get('/executions/:id', executionIdValidation, (req, res, next) => 
  executionController.getExecutionById(req, res, next)
);

router.post('/executions/:id/pause', executionIdValidation, (req, res, next) => 
  executionController.pauseExecution(req, res, next)
);

export default router;