import { Queue } from "bullmq";
import { redisConnection } from "./connection.ts";

export const EMAIL_QUEUE_NAME = "email-notifications";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  },
});

export default emailQueue;
