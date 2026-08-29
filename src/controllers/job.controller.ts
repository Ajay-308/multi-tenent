import type { Request, Response, NextFunction } from "express";
import { emailQueue } from "../queue/email.queue.ts";
import { pool } from "../db/pool.ts";
import { Errors } from "../utils/error.ts";

export async function getJobStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM notification_outbox WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) throw Errors.notFound("Job", "JOB_NOT_FOUND");
    const outboxRow = rows[0];

    if (outboxRow.status === "pending") {
      return res.status(200).json({
        id,
        status: "pending",
        metadata: {
          type: outboxRow.type,
          attempts: outboxRow.attempts,
          createdAt: outboxRow.created_at,
        },
      });
    }

    const job = await emailQueue.getJob(String(id));
    if (!job) {
      return res
        .status(200)
        .json({
          id,
          status: "completed",
          metadata: { note: "Job data expired after completion" },
        });
    }

    const state = await job.getState();
    const statusMap: Record<string, string> = {
      waiting: "pending",
      delayed: "pending",
      active: "active",
      completed: "completed",
      failed: "failed",
    };

    res.status(200).json({
      id,
      status: statusMap[state] || state,
      metadata: {
        attemptsMade: job.attemptsMade,
        data: job.data,
        failedReason: job.failedReason ?? null,
        returnValue: job.returnvalue ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}
