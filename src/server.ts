import { app } from "./app.ts";
import { env } from "./config/env.ts";

app.listen(env.port, () => {
  console.log(`TaskFlow API listening on port ${env.port}`);
});

export default app;
