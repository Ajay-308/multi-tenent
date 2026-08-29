import { outboxRepository } from "../repositories/outbox.repository.ts";
import { emailQueue } from "../queue/email.queue.ts";

const POLL_INTERVAL_MS = 3000;

export function startOutboxDispatcher() {
  const timer = setInterval(async () => {
    try {
      const pending = await outboxRepository.findPending(20);
      for (const row of pending) {
        try {
          await emailQueue.add("send-assignment-email", row.payload, {
            jobId: row.id,
          });
          await outboxRepository.markDispatched(row.id);
        } catch (err) {
          await outboxRepository.incrementAttempt(row.id);
          console.error(`Outbox dispatcher: retry failed for ${row.id}`, err);
        }
      }
    } catch (err) {
      console.error("Outbox dispatcher poll error:", err);
    }
  }, POLL_INTERVAL_MS);

  return () => clearInterval(timer);
}
