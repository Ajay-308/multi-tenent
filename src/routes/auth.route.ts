import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { authRateLimiter } from "../middleware/rateLimiter.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);
