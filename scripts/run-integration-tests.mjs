import { spawn } from "node:child_process";

const env = {
  ...process.env,
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5433/taskflow_test",
};
env.DATABASE_URL = env.TEST_DATABASE_URL;

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["vitest", "run", "tests/integration"], {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
