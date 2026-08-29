import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";
import { Errors } from "../utils/error.ts";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(Errors.unauthorized());
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(Errors.unauthorized());
  }
}
