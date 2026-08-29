import { pool } from "../db/pool.ts";

export interface OrgMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: "org_admin" | "member";
  created_at: Date;
  name?: string;
  email?: string;
}

export const orgMemberRepository = {
  async isMember(orgId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM org_members WHERE org_id = $1 AND user_id = $2`,
      [orgId, userId],
    );
    return rows.length > 0;
  },

  async findMembership(
    orgId: string,
    userId: string,
  ): Promise<OrgMemberRow | null> {
    const { rows } = await pool.query(
      `SELECT om.id, om.org_id, om.user_id, om.role, om.created_at, u.name, u.email
       FROM org_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.org_id = $1 AND om.user_id = $2`,
      [orgId, userId],
    );
    return rows[0] ?? null;
  },

  async add(
    orgId: string,
    userId: string,
    role: "org_admin" | "member" = "member",
  ): Promise<OrgMemberRow | null> {
    const { rows } = await pool.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (org_id, user_id) DO NOTHING
       RETURNING id, org_id, user_id, role, created_at`,
      [orgId, userId, role],
    );
    return rows[0] ?? null;
  },

  async list(
    orgId: string,
    { limit, offset }: { limit: number; offset: number },
  ) {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT om.id, om.org_id, om.user_id, om.role, om.created_at, u.name, u.email
         FROM org_members om
         JOIN users u ON u.id = om.user_id
         WHERE om.org_id = $1
         ORDER BY om.created_at ASC
         LIMIT $2 OFFSET $3`,
        [orgId, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM org_members WHERE org_id = $1`,
        [orgId],
      ),
    ]);
    return { rows: dataResult.rows as OrgMemberRow[], total: countResult.rows[0].count };
  },
};
