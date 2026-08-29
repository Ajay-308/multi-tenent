import { emailQueue } from "../queue/email.queue.ts";
import { outboxRepository } from "../repositories/outbox.repository.ts";
import { redisConnection } from "../queue/connection.ts";

export async function tryEnqueueAssignmentEmail(
  outboxId: string,
  payload: Record<string, unknown>,
) {
  try {
    const dedupeKey = `assign-email-dedupe:${payload.taskId}:${payload.userId}`;
    const acquired = await redisConnection.set(dedupeKey, "1", "EX", 5, "NX");
    if (!acquired) {
      await outboxRepository.markDispatched(outboxId);
      return;
    }

    await emailQueue.add("send-assignment-email", payload, { jobId: outboxId });
    await outboxRepository.markDispatched(outboxId);
  } catch (err) {
    console.error(
      `Failed to enqueue outbox ${outboxId}, will retry via poller:`,
      err,
    );
  }
}
