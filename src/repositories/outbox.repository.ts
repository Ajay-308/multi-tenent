import type { PoolClient } from "pg";
import { pool } from "../db/pool.ts";

export const outboxRepository = {
  async create(
    id: string,
    type: string,
    payload: Record<string, unknown>,
    client: PoolClient | typeof pool = pool,
  ) {
    await client.query(
      `INSERT INTO notification_outbox (id, type, payload) VALUES ($1, $2, $3)`,
      [id, type, JSON.stringify(payload)],
    );
  },

  async markDispatched(id: string) {
    await pool.query(
      `UPDATE notification_outbox SET status = 'dispatched', dispatched_at = now() WHERE id = $1`,
      [id],
    );
  },

  async incrementAttempt(id: string) {
    await pool.query(
      `UPDATE notification_outbox SET attempts = attempts + 1 WHERE id = $1`,
      [id],
    );
  },

  async findPending(limit = 20) {
    const { rows } = await pool.query(
      `SELECT * FROM notification_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`,
      [limit],
    );
    return rows;
  },
};
