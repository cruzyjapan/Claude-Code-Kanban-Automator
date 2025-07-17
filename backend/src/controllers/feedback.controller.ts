import { Request, Response, NextFunction } from 'express';
import { FeedbackService } from '../services/feedback.service';
import { ApiError } from '../middleware/error.middleware';
import { CreateFeedbackDto } from '../types';

export class FeedbackController {
  private feedbackService = new FeedbackService();

  async createFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const createFeedbackDto: CreateFeedbackDto = req.body;
      const feedback = await this.feedbackService.createFeedback(taskId, createFeedbackDto);
      res.status(201).json(feedback);
    } catch (error) {
      next(error);
    }
  }

  async getTaskFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const feedback = await this.feedbackService.getTaskFeedback(taskId);
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.feedbackService.deleteFeedback(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}