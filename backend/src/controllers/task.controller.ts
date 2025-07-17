import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { ApiError } from '../middleware/error.middleware';
import { CreateTaskDto, UpdateTaskDto, UpdateQueueDto } from '../types';

export class TaskController {
  private taskService = new TaskService();

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createTaskDto: CreateTaskDto = req.body;
      const task = await this.taskService.createTask(createTaskDto);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, priority, search } = req.query;
      const tasks = await this.taskService.getAllTasks({
        status: status as any,
        priority: priority as string,
        search: search as string
      });
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      // Check if includeArchived query param is set
      const includeArchived = req.query.includeArchived === 'true';
      const task = await this.taskService.getTaskById(id, includeArchived);
      
      // Get tags
      const tags = await this.taskService.getTaskTags(id);
      
      res.json({ ...task, tags });
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        next(new ApiError(404, 'Task not found'));
      } else {
        next(error);
      }
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateTaskDto: UpdateTaskDto = req.body;
      console.log('Updating task:', id, 'with data:', updateTaskDto);
      const task = await this.taskService.updateTask(id, updateTaskDto);
      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      if (error instanceof Error && error.message === 'Task not found') {
        next(new ApiError(404, 'Task not found'));
      } else {
        next(error);
      }
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.taskService.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getTasksByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const tasks = await this.taskService.getTasksByStatus(status as any);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getTaskQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const queue = await this.taskService.getTaskQueue(status);
      res.json(queue);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      const updateQueueDto: UpdateQueueDto = req.body;
      await this.taskService.updateTaskQueue(status, updateQueueDto.tasks);
      res.json({ message: 'Queue updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async executeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Update task status to 'requested' to queue it for execution
      await this.taskService.updateTask(id, { status: 'requested' });
      
      res.json({ message: 'Task queued for execution' });
    } catch (error) {
      next(error);
    }
  }

  async rejectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Increment version for re-execution
      await this.taskService.incrementTaskVersion(id);
      
      // Update task status to 'requested' to queue it for re-execution
      await this.taskService.updateTask(id, { status: 'requested' });
      
      res.json({ message: 'Task rejected and queued for re-execution' });
    } catch (error) {
      next(error);
    }
  }

  async archiveTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      console.log('Archiving task:', id);
      await this.taskService.archiveTask(id);
      res.json({ message: 'Task archived successfully' });
    } catch (error) {
      console.error('Error archiving task:', error);
      next(error);
    }
  }

  async getArchivedTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await this.taskService.getArchivedTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async permanentlyDeleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.taskService.permanentlyDeleteTask(id);
      res.json({ message: 'Task permanently deleted' });
    } catch (error: any) {
      console.error('Error permanently deleting task:', error);
      if (error.message === 'Task not found in archive') {
        res.status(404).json({ error: 'アーカイブにタスクが見つかりません' });
      } else if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: '関連データが存在するため削除できません' });
      } else {
        res.status(500).json({ 
          error: 'タスクの削除中にエラーが発生しました',
          message: error.message 
        });
      }
    }
  }

  async markAsViewed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.body.userId || 'default';
      await this.taskService.markAsViewed(id, userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async forceCleanup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.taskService.forceCleanup();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}