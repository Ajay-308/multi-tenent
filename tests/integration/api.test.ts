import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, afterAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
let app: typeof import("../../src/app.ts").app;
let pool: typeof import("../../src/db/pool.ts").pool;
let orgId: string;
let projectId: string;
let accessToken: string;
let email: string;

suite("TaskFlow API integration", () => {
  beforeEach(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    ({ app } = await import("../../src/app.ts"));
    ({ pool } = await import("../../src/db/pool.ts"));

    await pool.query(
      "TRUNCATE TABLE comments, task_assignments, tasks, projects, org_members, organizations, users, notification_outbox RESTART IDENTITY CASCADE",
    );

    email = `admin-${randomUUID()}@example.com`;
    const registered = await request(app).post("/auth/register").send({
      name: "Integration Admin",
      email,
      password: "Password123!",
    });
    expect(registered.status).toBe(201);
    accessToken = registered.body.accessToken;

    orgId = randomUUID();
    projectId = randomUUID();
    await pool.query(
      "INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)",
      [orgId, "Integration Org", `integration-${randomUUID()}`],
    );
    await pool.query(
      "INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'org_admin')",
      [orgId, registered.body.user.id],
    );
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("logs in and creates a project and task", async () => {
    const login = await request(app).post("/auth/login").send({
      email,
      password: "Password123!",
    });
    expect(login.status).toBe(200);

    const project = await request(app)
      .post(`/organizations/${orgId}/projects`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Integration Project" });
    expect(project.status).toBe(201);
    projectId = project.body.id;

    const task = await request(app)
      .post(`/organizations/${orgId}/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Integration Task", priority: "high" });
    expect(task.status).toBe(201);
    expect(task.body.title).toBe("Integration Task");
  });

  it(
    "lists organization members and exposes project dashboard counts",
    async () => {
    const otherUser = await request(app).post("/auth/register").send({
      name: "Project Member",
      email: `member-${randomUUID()}@example.com`,
      password: "Password123!",
    });
    expect(otherUser.status).toBe(201);

    const project = await request(app)
      .post(`/organizations/${orgId}/projects`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Dashboard Project" });
    expect(project.status).toBe(201);

    const memberList = await request(app)
      .get(`/organizations/${orgId}/members`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ page: 1, limit: 20 });
    expect(memberList.status).toBe(200);
    expect(Array.isArray(memberList.body.data)).toBe(true);
    expect(memberList.body.data.some((member: any) => member.user?.email === email)).toBe(true);

    const addMember = await request(app)
      .post(`/organizations/${orgId}/members`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ userId: otherUser.body.user.id, role: "member" });
    expect(addMember.status).toBe(201);

    const taskOne = await request(app)
      .post(`/organizations/${orgId}/projects/${project.body.id}/tasks`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Alpha task", status: "todo", priority: "high" });
    const taskTwo = await request(app)
      .post(`/organizations/${orgId}/projects/${project.body.id}/tasks`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Beta task", status: "done", priority: "medium" });

    const dashboard = await request(app)
      .get(`/organizations/${orgId}/projects/${project.body.id}/dashboard`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.projectId).toBe(project.body.id);
    expect(dashboard.body.counts.todo).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.counts.done).toBeGreaterThanOrEqual(1);

    const bulkStatus = await request(app)
      .patch(`/organizations/${orgId}/projects/${project.body.id}/tasks/bulk-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        taskIds: [taskOne.body.id, taskTwo.body.id],
        status: "in_progress",
      });
    expect(bulkStatus.status).toBe(200);
    expect(bulkStatus.body.updated).toEqual(expect.arrayContaining([taskOne.body.id, taskTwo.body.id]));

    const search = await request(app)
      .get(`/organizations/${orgId}/projects/${project.body.id}/tasks/search`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "Alpha" });
    expect(search.status).toBe(200);
    expect(Array.isArray(search.body.data)).toBe(true);
    expect(search.body.data.some((task: any) => task.title === "Alpha task")).toBe(true);
    }, 20000,
  );

  it("rejects access to a project in another organization with 403", async () => {
    const otherOrgId = randomUUID();
    await pool.query(
      "INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)",
      [otherOrgId, "Other Org", `other-${randomUUID()}`],
    );
    const otherProject = await pool.query(
      "INSERT INTO projects (org_id, name, created_by) VALUES ($1, $2, $3) RETURNING id",
      [otherOrgId, "Private Project", (await pool.query("SELECT id FROM users LIMIT 1")).rows[0].id],
    );

    const response = await request(app)
      .get(`/organizations/${orgId}/projects/${otherProject.rows[0].id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("You do not have access to this resource");
  });
});
