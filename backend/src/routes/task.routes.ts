import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TaskController } from '../controllers/task.controller';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const taskController = new TaskController();

// Create task validation
const createTaskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('due_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('estimated_hours').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  body('tags').optional().isArray(),
  validateRequest
];

// Update task validation
const updateTaskValidation = [
  param('id').notEmpty(),
  body('title').optional().notEmpty(),
  body('description').optional().isString(),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('status').optional().isIn(['pending', 'requested', 'working', 'review', 'completed']),
  body('due_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('estimated_hours').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  body('tags').optional().isArray(),
  validateRequest
];

// Update queue validation
const updateQueueValidation = [
  param('status').notEmpty(),
  body('tasks').isArray().withMessage('Tasks must be an array'),
  body('tasks.*.task_id').notEmpty(),
  body('tasks.*.position').isInt({ min: 0 }),
  validateRequest
];

// Routes
router.post('/tasks', createTaskValidation, (req, res, next) => taskController.createTask(req, res, next));
router.get('/tasks', (req, res, next) => taskController.getTasks(req, res, next));
router.get('/tasks/archived/list', (req, res, next) => taskController.getArchivedTasks(req, res, next));
router.get('/tasks/status/:status', (req, res, next) => taskController.getTasksByStatus(req, res, next));
router.get('/tasks/:id', (req, res, next) => taskController.getTaskById(req, res, next));
router.put('/tasks/:id', updateTaskValidation, (req, res, next) => taskController.updateTask(req, res, next));
router.delete('/tasks/:id', (req, res, next) => taskController.deleteTask(req, res, next));
router.get('/queue/:status', (req, res, next) => taskController.getTaskQueue(req, res, next));
router.put('/queue/:status', updateQueueValidation, (req, res, next) => taskController.updateTaskQueue(req, res, next));
router.post('/tasks/:id/execute', (req, res, next) => taskController.executeTask(req, res, next));
router.post('/tasks/:id/reject', (req, res, next) => taskController.rejectTask(req, res, next));
router.post('/tasks/:id/archive', (req, res, next) => taskController.archiveTask(req, res, next));
router.delete('/tasks/:id/permanent', (req, res, next) => taskController.permanentlyDeleteTask(req, res, next));
router.post('/tasks/:id/view', (req, res, next) => taskController.markAsViewed(req, res, next));
router.post('/tasks/force-cleanup', (req, res, next) => taskController.forceCleanup(req, res, next));

export default router;