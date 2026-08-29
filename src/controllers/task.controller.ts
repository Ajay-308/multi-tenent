import type { Request, Response, NextFunction } from "express";
import { taskService } from "../service/task.service.ts";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  assignTaskSchema,
  bulkStatusUpdateSchema,
  searchQuerySchema,
} from "../validator/task.validator.ts";
import { Errors } from "../utils/error.ts";

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const task = await taskService.create(
        req.project!.id,
        req.user!.id,
        parsed.data,
      );
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listTasksQuerySchema.safeParse(req.query);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const { page, limit, ...filters } = parsed.data;
      const result = await taskService.list(req.project!.id, filters, {
        page,
        limit,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const assignees = await taskService.getAssignees(req.task!.id);
      res.status(200).json({ ...req.task, assignees });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const updated = await taskService.update(
        String(req.params.taskId),
        parsed.data,
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.remove(String(req.params.taskId));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = assignTaskSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const { assignment, alreadyAssigned } = await taskService.assign(
        req.org!.id,
        String(req.params.taskId),
        parsed.data.userId,
        req.user!.id,
      );
      res.status(200).json({
        taskId: req.params.taskId,
        userId: parsed.data.userId,
        assigned: Boolean(assignment),
        alreadyAssigned,
      });
    } catch (err) {
      next(err);
    }
  },

  async unassign(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.unassign(
        String(req.params.taskId),
        String(req.params.userId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async bulkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = bulkStatusUpdateSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const updatedIds = await taskService.bulkUpdateStatus(
        req.project!.id,
        parsed.data.taskIds,
        parsed.data.status,
      );
      res.status(200).json({ updated: updatedIds });
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const { q, page, limit } = parsed.data;
      const result = await taskService.search(req.project!.id, q, {
        page,
        limit,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
