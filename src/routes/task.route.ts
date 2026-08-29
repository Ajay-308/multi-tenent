import { Router } from "express";
import { taskController } from "../controllers/task.controller.ts";
import { loadTask } from "../middleware/task.middleware.ts";

export const taskRouter = Router({ mergeParams: true });

// Static routes must precede /:taskId.
taskRouter.get("/search", taskController.search);
taskRouter.patch("/bulk-status", taskController.bulkStatus);

taskRouter.post("/", taskController.create);
taskRouter.get("/", taskController.list);
taskRouter.get("/:taskId", loadTask, taskController.getOne);
taskRouter.patch("/:taskId", loadTask, taskController.update);
taskRouter.delete("/:taskId", loadTask, taskController.remove);
taskRouter.post("/:taskId/assign", loadTask, taskController.assign);
taskRouter.delete("/:taskId/assign/:userId", loadTask, taskController.unassign);
