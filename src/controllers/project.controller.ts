import type { Request, Response, NextFunction } from "express";
import { projectService } from "../service/project.service.ts";
import {
  createProjectSchema,
  updateProjectSchema,
  listQuerySchema,
} from "../validator/project.validator.ts";
import { Errors } from "../utils/error.ts";

export const projectController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const project = await projectService.create(
        req.org!.id,
        req.user!.id,
        parsed.data,
      );
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const result = await projectService.list(req.org!.id, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response) {
    res.status(200).json(req.project);
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const updated = await projectService.update(
        String(req.params.projectId),
        parsed.data,
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.remove(String(req.params.projectId));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await projectService.dashboard(
        String(req.params.projectId),
      );
      res.status(200).json({ projectId: req.params.projectId, counts });
    } catch (err) {
      next(err);
    }
  },
};
