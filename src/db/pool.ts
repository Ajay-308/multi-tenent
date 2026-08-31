import { Pool } from "pg";
import { env } from "../config/env.ts";

const isNeonConnection = /(neon|pooler)/i.test(env.databaseUrl);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ...(isNeonConnection
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});

pool.on("connect", () => {
  console.log("connected to the database");
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
