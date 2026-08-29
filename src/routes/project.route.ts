import { Router } from "express";
import { projectController } from "../controllers/project.controller.ts";
import { loadProject } from "../middleware/project.middleware.ts";
import { requireRole } from "../middleware/org.middleware.ts";
import { taskRouter } from "./task.route.ts";

export const projectRouter = Router({ mergeParams: true });

projectRouter.post("/", projectController.create);
projectRouter.get("/", projectController.list);
projectRouter.get("/:projectId", loadProject, projectController.getOne);
projectRouter.patch("/:projectId", loadProject, projectController.update);
projectRouter.delete(
  "/:projectId",
  loadProject,
  requireRole("org_admin"),
  projectController.remove,
);
projectRouter.get(
  "/:projectId/dashboard",
  loadProject,
  projectController.dashboard,
);

projectRouter.use("/:projectId/tasks", loadProject, taskRouter);
