import { pool } from "../db/pool.ts";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export const userRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return rows[0] ?? null;
  },

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserRow> {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.email, data.passwordHash],
    );
    return rows[0];
  },

  async listOrgsForUser(userId: string) {
    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.slug, om.role
       FROM organizations o
       JOIN org_members om ON om.org_id = o.id
       WHERE om.user_id = $1`,
      [userId],
    );
    return rows;
  },
};
