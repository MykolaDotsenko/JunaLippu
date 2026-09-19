import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const directory = mkdtempSync(join(tmpdir(), "junalippu-test-"));
const databasePath = join(directory, "e2e.db");
const baseEnv = {
  ...process.env,
  DATABASE_URL: pathToFileURL(databasePath).href,
  JUNALIPPU_TEST_DB: "1",
};

const executable = (name) =>
  process.platform === "win32" && name === "pnpm" ? "pnpm.cmd" : name;

const run = (name, args, nodeEnv) => {
  const result = spawnSync(executable(name), args, {
    env: { ...baseEnv, NODE_ENV: nodeEnv },
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
  const migrated = run(
    "pnpm",
    ["exec", "prisma", "migrate", "deploy"],
    "test",
  );
  const seeded =
    migrated && run("node", ["tests/e2e-seed.mjs"], "test");

  if (seeded) {
    run("pnpm", ["exec", "playwright", "test"], "production");
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
