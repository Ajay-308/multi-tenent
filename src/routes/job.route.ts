import { Router } from "express";
import { getJobStatus } from "../controllers/job.controller.ts";

export const jobRouter = Router();
jobRouter.get("/:id", getJobStatus);
