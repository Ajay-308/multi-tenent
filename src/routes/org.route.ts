import { Router } from "express";
import { orgController } from "../controllers/org.controller.ts";
import { requireRole } from "../middleware/org.middleware.ts";

export const orgRouter = Router({ mergeParams: true });

orgRouter.get("/members", orgController.listMembers);
orgRouter.post(
  "/members",
  requireRole("org_admin"),
  orgController.addMember,
);
