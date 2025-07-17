import { Router } from 'express';
import { body, param } from 'express-validator';
import { FeedbackController } from '../controllers/feedback.controller';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const feedbackController = new FeedbackController();

// Create feedback validation
const createFeedbackValidation = [
  param('taskId').notEmpty(),
  body('content').notEmpty().withMessage('Feedback content is required'),
  body('user_id').optional().isString(),
  validateRequest
];

// Routes
router.post('/tasks/:taskId/feedback', createFeedbackValidation, (req, res, next) => 
  feedbackController.createFeedback(req, res, next)
);

router.get('/tasks/:taskId/feedback', (req, res, next) => 
  feedbackController.getTaskFeedback(req, res, next)
);

router.delete('/feedback/:id', (req, res, next) => 
  feedbackController.deleteFeedback(req, res, next)
);

export default router;