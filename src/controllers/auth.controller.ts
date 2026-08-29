import { type Request, type Response, type NextFunction } from "express";
import { authService } from "../service/auth.service.ts";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validator/auth.validator.ts";
import { Errors } from "../utils/error.ts";

function meta(req: Request) {
  return {
    userAgent: req.headers["user-agent"] as string | undefined,
    ipAddress: req.ip,
  };
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const result = await authService.register(parsed.data, meta(req));
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const result = await authService.login(parsed.data, meta(req));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const result = await authService.refresh(
        parsed.data.refreshToken,
        meta(req),
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      await authService.logout(parsed.data.refreshToken);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logoutAll(req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
