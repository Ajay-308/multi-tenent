import bcrypt from "bcrypt";
import { pool } from "./pool.ts";

const BCRYPT_COST = 12;

const ORG_SEEDS = [
  {
    name: "Acme Inc",
    slug: "acme",
    users: ["Alice Admin", "Bob Builder", "Charlie QA", "Diana Designer"],
    projects: [
      { name: "Website Redesign", description: "Revamp the public marketing site" },
      { name: "Mobile App", description: "Native iOS/Android app for customers" },
      { name: "Customer Portal", description: "Self-service portal for account management" },
    ],
  },
  {
    name: "Globex Corp",
    slug: "globex",
    users: ["Carol Chief", "Dave Dev", "Eve Ops", "Frank PM"],
    projects: [
      { name: "Data Migration", description: "Move legacy DB to the new warehouse" },
      { name: "Marketing Site", description: "New landing pages for campaigns" },
      { name: "Automation Suite", description: "Workflow automation across internal tools" },
    ],
  },
  {
    name: "Northwind Labs",
    slug: "northwind",
    users: ["Grace Lead", "Henry Analyst", "Iris Engineer", "Jack Support"],
    projects: [
      { name: "AI Insights Hub", description: "Internal analytics dashboard for product signals" },
      { name: "Support Bot", description: "AI bot for first-pass customer support" },
      { name: "Ops Console", description: "Operational dashboards and alerts" },
    ],
  },
  {
    name: "Wayne Enterprises",
    slug: "wayne",
    users: ["Kelly Admin", "Leo Sales", "Mia Product", "Noah Finance"],
    projects: [
      { name: "Sales CRM", description: "Modern CRM for tracking leads and deals" },
      { name: "Finance Dashboard", description: "Shared dashboard for budget health" },
      { name: "Launch Playbook", description: "Go-live checklist and launch assets" },
    ],
  },
  {
    name: "Bluebird Studio",
    slug: "bluebird",
    users: ["Olivia Creative", "Paul Design", "Quinn Strategy", "Rachel Content"],
    projects: [
      { name: "Brand Refresh", description: "Update product identity and messaging" },
      { name: "Content Calendar", description: "Campaign planning and publishing workflow" },
      { name: "Landing Pages", description: "Pages for launches, testimonials, and offers" },
    ],
  },
];

const TASK_TEMPLATES = [
  {
    title: "Set up design system",
    description: "Create base tokens, typography, and color palette",
    status: "done",
    priority: "high",
    due: "2026-01-15",
  },
  {
    title: "Build homepage hero",
    description: "Design and implement the above-the-fold hero section",
    status: "in_progress",
    priority: "high",
    due: "2026-09-05",
  },
  {
    title: "Write pricing page copy",
    description: "Create pricing and comparison page content",
    status: "todo",
    priority: "medium",
    due: "2026-09-20",
  },
  {
    title: "Fix mobile nav overflow bug",
    description: "Resolve overflow on small-screen navigation",
    status: "review",
    priority: "urgent",
    due: "2026-08-28",
  },
  {
    title: "Implement push notifications",
    description: "Set up reminders and event-triggered mobile notifications",
    status: "todo",
    priority: "high",
    due: "2026-10-01",
  },
  {
    title: "Schema mapping doc",
    description: "Map legacy tables to the new schema and validation rules",
    status: "done",
    priority: "high",
    due: "2026-06-10",
  },
  {
    title: "Write migration scripts",
    description: "Build ETL scripts for customer and order migration",
    status: "in_progress",
    priority: "urgent",
    due: "2026-09-01",
  },
  {
    title: "Validate row counts post-migration",
    description: "Run reconciliation checks after cutover",
    status: "todo",
    priority: "high",
    due: "2026-09-15",
  },
  {
    title: "Landing page for Q4 campaign",
    description: "Prepare the target campaign page and CTA",
    status: "in_progress",
    priority: "medium",
    due: "2026-09-10",
  },
  {
    title: "A/B test signup form",
    description: "Compare conversion performance of two signup variants",
    status: "review",
    priority: "low",
    due: "2026-09-25",
  },
  {
    title: "Build KPI dashboard",
    description: "Create metrics views for product and lifecycle trends",
    status: "todo",
    priority: "high",
    due: "2026-10-05",
  },
  {
    title: "Prepare launch assets",
    description: "Package design, copy, and campaign files for rollout",
    status: "review",
    priority: "medium",
    due: "2026-09-18",
  },
];

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE comments, task_assignments, tasks, projects, org_members, organizations, users
      RESTART IDENTITY CASCADE
    `);

    const passwordHash = await bcrypt.hash("Password123!", BCRYPT_COST);
    const orgs: Array<{ id: string; slug: string; name: string }> = [];
    const users: Array<{ id: string; email: string; name: string }> = [];
    const projects: Array<{ id: string; org_id: string; name: string }> = [];
    const tasks: Array<{ id: string; title: string }> = [];
    const assignments: Array<{ taskTitle: string; userId: string; assignedBy: string }> = [];
    const comments: Array<{ taskTitle: string; authorId: string; body: string }> = [];

    for (const orgSeed of ORG_SEEDS) {
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug`,
        [orgSeed.name, orgSeed.slug],
      );
      const org = orgResult.rows[0];
      orgs.push(org);

      const createdOrgUsers: Array<{ id: string; name: string; email: string }> = [];
      for (const [index, userName] of orgSeed.users.entries()) {
        const email = `${userName.toLowerCase().replace(/\s+/g, ".")}@${org.slug}.test`;
        const userResult = await client.query(
          `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
          [userName, email, passwordHash],
        );
        const user = userResult.rows[0];
        createdOrgUsers.push(user);
        users.push(user);

        await client.query(
          `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)`,
          [org.id, user.id, index === 0 ? "org_admin" : "member"],
        );
      }

      for (const [projectIndex, projectSeed] of orgSeed.projects.entries()) {
        const projectResult = await client.query(
          `INSERT INTO projects (org_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id, org_id, name`,
          [org.id, projectSeed.name, projectSeed.description, createdOrgUsers[0].id],
        );
        const project = projectResult.rows[0];
        projects.push(project);

        for (const [taskIndex, taskTemplate] of TASK_TEMPLATES.entries()) {
          const taskResult = await client.query(
            `INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, title`,
            [
              project.id,
              `${taskTemplate.title}${projectIndex === 0 && taskIndex === 0 ? "" : ""}`,
              taskTemplate.description,
              taskTemplate.status,
              taskTemplate.priority,
              taskTemplate.due,
              createdOrgUsers[(taskIndex + projectIndex) % createdOrgUsers.length].id,
            ],
          );

          const task = taskResult.rows[0];
          tasks.push(task);

          const assigneePool = createdOrgUsers.slice(1);
          const assignedUser = assigneePool[(projectIndex + taskIndex) % assigneePool.length] ?? createdOrgUsers[0];
          const secondUser = assigneePool[(projectIndex + taskIndex + 1) % assigneePool.length] ?? createdOrgUsers[0];

          await client.query(
            `INSERT INTO task_assignments (task_id, user_id, assigned_by) VALUES ($1, $2, $3)`,
            [task.id, assignedUser.id, createdOrgUsers[0].id],
          );

          if (taskIndex % 2 === 0) {
            await client.query(
              `INSERT INTO task_assignments (task_id, user_id, assigned_by) VALUES ($1, $2, $3)`,
              [task.id, secondUser.id, createdOrgUsers[0].id],
            );
          }

          assignments.push({ taskTitle: task.title, userId: assignedUser.id, assignedBy: createdOrgUsers[0].id });

          if (taskIndex % 3 === 0) {
            const commentBody =
              taskIndex % 2 === 0
                ? "Initial review is complete and ready for the next step."
                : "The team is aligned on implementation and timeline.";
            await client.query(
              `INSERT INTO comments (task_id, author_id, body) VALUES ($1, $2, $3)`,
              [task.id, createdOrgUsers[(taskIndex + 1) % createdOrgUsers.length].id, commentBody],
            );
            comments.push({ taskTitle: task.title, authorId: createdOrgUsers[(taskIndex + 1) % createdOrgUsers.length].id, body: commentBody });
          }
        }
      }
    }

    await client.query("COMMIT");

    console.log("Seed complete:");
    console.log(`  organizations: ${orgs.length}`);
    console.log(`  users: ${users.length} (password for all: "Password123!")`);
    console.log(`  projects: ${projects.length}`);
    console.log(`  tasks: ${tasks.length}`);
    console.log(`  assignments: ${assignments.length}`);
    console.log(`  comments: ${comments.length}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed, rolled back:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
