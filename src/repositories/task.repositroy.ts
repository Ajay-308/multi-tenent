import { randomUUID } from "crypto";
import { pool } from "../db/pool.ts";
import { outboxRepository } from "./outbox.repository.ts";

interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  due_from?: string;
  due_to?: string;
}

function buildTaskFilters(projectId: string, filters: TaskFilters) {
  const conditions = ["project_id = $1", "deleted_at IS NULL"];
  const values: unknown[] = [projectId];
  let i = 2;

  if (filters.status) {
    conditions.push(`status = $${i}`);
    values.push(filters.status);
    i++;
  }
  if (filters.priority) {
    conditions.push(`priority = $${i}`);
    values.push(filters.priority);
    i++;
  }
  if (filters.assignee) {
    conditions.push(
      `EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = tasks.id AND ta.user_id = $${i})`,
    );
    values.push(filters.assignee);
    i++;
  }
  if (filters.due_from) {
    conditions.push(`due_date >= $${i}`);
    values.push(filters.due_from);
    i++;
  }
  if (filters.due_to) {
    conditions.push(`due_date <= $${i}`);
    values.push(filters.due_to);
    i++;
  }

  return { where: conditions.join(" AND "), values, nextIndex: i };
}

export const taskRepository = {
  async create(projectId: string, createdBy: string, data: any) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_by)
             VALUES ($1, $2, $3, COALESCE($4::task_status, 'todo'::task_status),
               COALESCE($5::task_priority, 'medium'::task_priority), $6, $7)
       RETURNING *`,
      [
        projectId,
        data.title,
        data.description ?? null,
        data.status ?? null,
        data.priority ?? null,
        data.due_date ?? null,
        createdBy,
      ],
    );
    return rows[0];
  },

  async findByIdInProject(projectId: string, taskId: string) {
    const { rows } = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [taskId, projectId],
    );
    return rows[0] ?? null;
  },

  async list(
    projectId: string,
    filters: TaskFilters,
    { limit, offset }: { limit: number; offset: number },
  ) {
    const { where, values, nextIndex } = buildTaskFilters(projectId, filters);
    const dataValues = [...values, limit, offset];
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM tasks WHERE ${where}
         ORDER BY created_at DESC LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
        dataValues,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM tasks WHERE ${where}`,
        values,
      ),
    ]);
    return { rows: dataResult.rows, total: countResult.rows[0].count };
  },

  async update(taskId: string, data: Record<string, unknown>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
    if (fields.length === 0) return null;
    values.push(taskId);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async softDelete(taskId: string) {
    await pool.query(`UPDATE tasks SET deleted_at = now() WHERE id = $1`, [
      taskId,
    ]);
  },

  async getAssignees(taskId: string) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, ta.assigned_at
       FROM task_assignments ta JOIN users u ON u.id = ta.user_id
       WHERE ta.task_id = $1`,
      [taskId],
    );
    return rows;
  },

  async assign(taskId: string, userId: string, assignedBy: string) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO task_assignments (task_id, user_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (task_id, user_id) DO NOTHING
         RETURNING *`,
        [taskId, userId, assignedBy],
      );

      const assignment = rows[0] ?? null;
      let outboxId: string | null = null;
      if (assignment) {
        outboxId = randomUUID();
        await outboxRepository.create(
          outboxId,
          "task_assignment_email",
          { taskId, userId, assignedBy, assignmentId: assignment.id },
          client,
        );
      }

      await client.query("COMMIT");
      return { assignment, outboxId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async unassign(taskId: string, userId: string) {
    const { rowCount } = await pool.query(
      `DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2`,
      [taskId, userId],
    );
    return (rowCount ?? 0) > 0;
  },

  async bulkUpdateStatus(projectId: string, taskIds: string[], status: string) {
    const { rows } = await pool.query(
      `UPDATE tasks SET status = $1
       WHERE project_id = $2 AND id = ANY($3::uuid[]) AND deleted_at IS NULL
       RETURNING id`,
      [status, projectId, taskIds],
    );
    return rows.map((r) => r.id);
  },

  async searchFullText(
    projectId: string,
    query: string,
    { limit, offset }: { limit: number; offset: number },
  ) {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT *, ts_rank(search_vector, websearch_to_tsquery('english', $2)) AS rank
         FROM tasks
         WHERE project_id = $1 AND deleted_at IS NULL
           AND search_vector @@ websearch_to_tsquery('english', $2)
         ORDER BY rank DESC
         LIMIT $3 OFFSET $4`,
        [projectId, query, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM tasks
         WHERE project_id = $1 AND deleted_at IS NULL
           AND search_vector @@ websearch_to_tsquery('english', $2)`,
        [projectId, query],
      ),
    ]);
    return { rows: dataResult.rows, total: countResult.rows[0].count };
  },
};
