import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  throw new Error("Usage: node scripts/run-test-db.mjs <command> [...args]");
}

const directory = mkdtempSync(join(tmpdir(), "junalippu-test-"));
const databasePath = join(directory, "test.db");
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: pathToFileURL(databasePath).href,
  JUNALIPPU_TEST_DB: "1",
};

const executable = (name) =>
  process.platform === "win32" && name === "pnpm" ? "pnpm.cmd" : name;

const run = (name, commandArgs) => {
  const result = spawnSync(executable(name), commandArgs, {
    env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }
  return true;
};

try {
  if (run("pnpm", ["exec", "prisma", "migrate", "deploy"])) {
    run(command, args);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
