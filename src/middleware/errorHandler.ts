import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../utils/error.ts";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details || {},
    });
  }
  console.error(err);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    details: {},
  });
}
