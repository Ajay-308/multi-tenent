import "dotenv/config";
import "./email.worker.ts";
import { startOutboxDispatcher } from "../job/outBookDispatcher.ts";

startOutboxDispatcher();
console.log(
  "Worker process started - listening for email jobs + outbox polling",
);
