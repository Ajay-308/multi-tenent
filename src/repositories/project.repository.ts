import { pool } from "../db/pool.ts";

export const projectRepository = {
  async create(
    orgId: string,
    createdBy: string,
    data: { name: string; description?: string },
  ) {
    const { rows } = await pool.query(
      `INSERT INTO projects (org_id, name, description, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, data.name, data.description ?? null, createdBy],
    );
    return rows[0];
  },

  async findByIdInOrg(orgId: string, projectId: string) {
    const { rows } = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL`,
      [projectId, orgId],
    );
    return rows[0] ?? null;
  },

  async list(
    orgId: string,
    { limit, offset }: { limit: number; offset: number },
  ) {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM projects WHERE org_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [orgId, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM projects WHERE org_id = $1 AND deleted_at IS NULL`,
        [orgId],
      ),
    ]);
    return { rows: dataResult.rows, total: countResult.rows[0].count };
  },

  async update(projectId: string, data: Record<string, unknown>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
    if (fields.length === 0) return null;
    values.push(projectId);
    const { rows } = await pool.query(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async softDelete(projectId: string) {
    await pool.query(`UPDATE projects SET deleted_at = now() WHERE id = $1`, [
      projectId,
    ]);
  },

  async dashboardCounts(projectId: string) {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM tasks WHERE project_id = $1 AND deleted_at IS NULL
       GROUP BY status`,
      [projectId],
    );
    const base: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    for (const row of rows) base[row.status] = row.count;
    return base;
  },
};
