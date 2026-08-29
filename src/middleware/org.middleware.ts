import { type Request, type Response, type NextFunction } from "express";
import { pool } from "../db/pool.ts";
import { Errors } from "../utils/error.ts";

// Return 403 when membership is missing or the organization is unknown.
export async function requireOrgMembership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgIdParam = req.params.orgId;
  if (!orgIdParam || Array.isArray(orgIdParam)) {
    return next(Errors.forbidden());
  }
  const orgId: string = orgIdParam;

  const result = await pool.query(
    `SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2`,
    [orgId, req.user!.id],
  );

  if (result.rowCount === 0) {
    return next(Errors.forbidden());
  }

  req.org = { id: orgId, role: result.rows[0].role };
  next();
}

export function requireRole(...roles: Array<"org_admin" | "member">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.org || !roles.includes(req.org.role)) {
      return next(Errors.forbidden());
    }
    next();
  };
}
