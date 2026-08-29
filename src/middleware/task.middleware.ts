import type { Request, Response, NextFunction } from "express";
import { taskRepository } from "../repositories/task.repositroy.ts";
import { Errors } from "../utils/error.ts";

// Return 403 when the task is outside the loaded project.
export async function loadTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const task = await taskRepository.findByIdInProject(
    req.project!.id,
    String(req.params.taskId),
  );
  if (!task) return next(Errors.forbidden());
  req.task = task;
  next();
}
