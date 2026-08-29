import { Worker, type Job } from "bullmq";
import { redisConnection } from "../queue/connection.ts";
import { EMAIL_QUEUE_NAME } from "../queue/email.queue.ts";
import { sendMockEmail } from "../mail/mockMailer.ts";
import { pool } from "../db/pool.ts";

interface AssignmentEmailPayload {
  taskId: string;
  userId: string;
  assignedBy: string;
  assignmentId: string;
}

async function processAssignmentEmail(job: Job<AssignmentEmailPayload>) {
  const { taskId, userId } = job.data;

  const { rows } = await pool.query(
    `SELECT u.email, u.name, t.title FROM users u, tasks t WHERE u.id = $1 AND t.id = $2`,
    [userId, taskId],
  );
  if (rows.length === 0) {
    console.warn(`Skipping email for job ${job.id}: user/task missing`);
    return { skipped: true };
  }

  const { email, name, title } = rows[0];
  await sendMockEmail(
    email,
    `You've been assigned: ${title}`,
    `Hi ${name}, you were assigned a new task: "${title}".`,
  );
  return { sentTo: email };
}

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  processAssignmentEmail,
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: { max: 50, duration: 60_000 },
  },
);

emailWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
emailWorker.on("failed", (job, err) => {
  console.error(
    `Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err.message,
  );
});
