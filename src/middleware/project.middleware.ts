import { type Request, type Response, type NextFunction } from "express";
import { projectRepository } from "../repositories/project.repository.ts";
import { Errors } from "../utils/error.ts";

// Return 403 for missing and cross-tenant projects.
export async function loadProject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const project = await projectRepository.findByIdInOrg(
    req.org!.id,
    Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId,
  );
  if (!project) return next(Errors.forbidden());
  req.project = project;
  next();
}
