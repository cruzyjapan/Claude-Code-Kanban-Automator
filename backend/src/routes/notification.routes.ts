import { Router } from 'express';
import { param } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Get user notifications
router.get('/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationService = req.app.locals.notificationService;
    const userId = req.query.userId as string || 'default';
    const unreadOnly = req.query.unreadOnly === 'true';
    
    notificationService.getUserNotifications(userId, unreadOnly)
      .then((notifications: any) => res.json(notifications))
      .catch(next);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/notifications/:id/read', 
  [param('id').notEmpty(), validateRequest],
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationService = req.app.locals.notificationService;
      const { id } = req.params;
      
      notificationService.markAsRead(id)
        .then(() => res.json({ message: 'Notification marked as read' }))
        .catch(next);
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.put('/notifications/read-all', (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationService = req.app.locals.notificationService;
    const userId = req.body.userId || 'default';
    
    notificationService.markAllAsRead(userId)
      .then(() => res.json({ message: 'All notifications marked as read' }))
      .catch(next);
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/notifications/:id', 
  [param('id').notEmpty(), validateRequest],
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationService = req.app.locals.notificationService;
      const { id } = req.params;
      
      notificationService.deleteNotification(id)
        .then(() => res.json({ message: 'Notification deleted successfully' }))
        .catch(next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;