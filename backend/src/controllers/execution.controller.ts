import { Request, Response, NextFunction } from 'express';
import { ExecutionService } from '../services/execution.service';
import { ApiError } from '../middleware/error.middleware';

export class ExecutionController {
  private executionService = new ExecutionService();

  async getTaskExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const executions = await this.executionService.getTaskExecutions(taskId);
      res.json(executions);
    } catch (error) {
      next(error);
    }
  }

  async getExecutionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const execution = await this.executionService.getExecutionById(id);
      res.json(execution);
    } catch (error) {
      if (error instanceof Error && error.message === 'Execution not found') {
        next(new ApiError(404, 'Execution not found'));
      } else {
        next(error);
      }
    }
  }

  async pauseExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const execution = await this.executionService.updateExecution(id, { status: 'paused' });
      res.json(execution);
    } catch (error) {
      next(error);
    }
  }
}