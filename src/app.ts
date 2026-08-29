import express from "express";
import { authRouter } from "./routes/auth.route.ts";
import { projectRouter } from "./routes/project.route.ts";
import { orgRouter } from "./routes/org.route.ts";
import { requireAuth } from "./middleware/auth.middleware.ts";
import { requireOrgMembership } from "./middleware/org.middleware.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { jobRouter } from "./routes/job.route.ts";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs/openapi.ts";

export const app = express();

app.use(express.json());
app.set("trust proxy", 1);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use("/auth", authRouter);

app.use(
  "/organizations/:orgId",
  requireAuth,
  requireOrgMembership,
  orgRouter,
);
app.use(
  "/organizations/:orgId/projects",
  requireAuth,
  requireOrgMembership,
  projectRouter,
);
app.use("/jobs", requireAuth, jobRouter);

app.use(errorHandler);
