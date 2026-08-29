import crypto from "crypto";
import { pool } from "../db/pool.ts";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const refreshTokenRepository = {
  hashToken,

  async create(data: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.id,
        data.userId,
        hashToken(data.token),
        data.expiresAt,
        data.userAgent ?? null,
        data.ipAddress ?? null,
      ],
    );
  },

  async findByToken(token: string) {
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  },

  async revokeById(id: string, replacedByTokenId?: string) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = now(), replaced_by_token_id = $2 WHERE id = $1`,
      [id, replacedByTokenId ?? null],
    );
  },

  async revokeAllForUser(userId: string) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  },
};
