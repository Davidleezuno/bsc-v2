import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HYPERDRIVE_LOCAL_CONNECTION_ENV =
  "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE";

const loadedEnv = [
  ".env",
  ".dev.vars",
  ".env.local",
].reduce((env, path) => ({ ...env, ...readEnvFile(path) }), {});

const childEnv = {
  ...loadedEnv,
  ...process.env,
};

if (!childEnv[HYPERDRIVE_LOCAL_CONNECTION_ENV] && childEnv.DATABASE_URL) {
  childEnv[HYPERDRIVE_LOCAL_CONNECTION_ENV] = childEnv.DATABASE_URL;
}

const wranglerBin = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler"
);

const child = spawn(wranglerBin, ["pages", "dev", "dist"], {
  env: childEnv,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return env;
      }

      const delimiterIndex = trimmedLine.indexOf("=");

      if (delimiterIndex === -1) {
        return env;
      }

      const key = trimmedLine
        .slice(0, delimiterIndex)
        .trim()
        .replace(/^export\s+/, "");
      const value = unquote(trimmedLine.slice(delimiterIndex + 1).trim());

      if (key) {
        env[key] = value;
      }

      return env;
    }, {});
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
