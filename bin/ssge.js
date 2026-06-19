#!/usr/bin/env node

import { spawn } from "child_process";
import { createServer } from "net";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

// CLI flags take precedence over env vars, the config file, and defaults.
const cliPort = takeFlagValue("--port");
const cliHost = takeFlagValue("--host");

if (cliPort !== undefined && !/^\d+$/.test(cliPort)) {
  console.error(
    "Please provide a valid port number: ssge <path_to_folder> --port <port>",
  );
  process.exit(1);
}

if (cliHost !== undefined && (cliHost === "" || cliHost.startsWith("-"))) {
  console.error(
    "Please provide a host to listen on: ssge <path_to_folder> --host <address>",
  );
  process.exit(1);
}

const targetPath = args[0];

if (!targetPath) {
  console.error(
    "Please provide a path to the folder: ssge <path_to_folder> [--port <port>] [--host <address>]",
  );
  process.exit(1);
}

// Resolve the absolute path
const absoluteTargetPath = resolve(targetPath);
const configCandidates = [
  join(absoluteTargetPath, ".sserc.js"),
  join(process.cwd(), ".sserc.js"),
];
const resolvedConfigPath =
  configCandidates.find((candidate) => existsSync(candidate)) ?? "";

if (!existsSync(absoluteTargetPath)) {
  console.error(`The path "${absoluteTargetPath}" does not exist`);
  process.exit(1);
}

const config = await loadConfig(resolvedConfigPath);

// Precedence: CLI flag > env var > config file > default.
const port =
  cliPort ?? process.env.PORT ?? normalizePort(config.port) ?? "4321";
const host =
  cliHost ?? process.env.HOST ?? normalizeHost(config.host) ?? "localhost";

// Get the absolute path to the dist directory
const distPath = join(__dirname, "..", "dist");

console.log(`Starting SSG Editor for folder: ${absoluteTargetPath}`);
if (resolvedConfigPath) {
  console.log(`Using config: ${resolvedConfigPath}`);
}

// Refuse to start when the requested port is taken instead of silently
// drifting to another one, which leaves the printed URL pointing at the
// wrong server.
if (!(await isPortAvailable(host, port))) {
  console.error(
    `Port ${port} is already in use. Stop the process using it or pick another with --port <port>.`,
  );
  process.exit(1);
}

console.log(`SSG Editor is running at http://${host}:${port}`);
console.log("Press Ctrl+C to stop the server");

// Spawn the server process. We pipe (rather than inherit) stdout/stderr so we
// can strip the underlying framework's branded log lines and keep the CLI
// presenting only SSG Editor output.
const server = spawn("node", [join(distPath, "server", "entry.mjs")], {
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    TARGET_PATH: absoluteTargetPath,
    SSG_EDITOR_CONFIG_PATH: resolvedConfigPath,
  },
  stdio: ["inherit", "pipe", "pipe"],
});

pipeFiltered(server.stdout, process.stdout);
pipeFiltered(server.stderr, process.stderr);

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nStopping SSG Editor...");
  server.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("\nStopping SSG Editor...");
  server.kill();
  process.exit();
});

// Matches the framework's branded logger output (e.g. astro's
// "HH:MM:SS [@astrojs/node] Server listening ..." or "[astro] ...") so we can
// keep it from leaking into the CLI's output.
const BRANDED_LOG_LINE = /\[(?:@?astro(?:js)?)\b[^\]]*\]/i;

// Forwards a child stream to a destination stream line-by-line, dropping
// branded framework log lines.
function pipeFiltered(source, destination) {
  if (!source) {
    return;
  }

  let buffer = "";

  source.setEncoding("utf8");
  source.on("data", (chunk) => {
    buffer += chunk;

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (!BRANDED_LOG_LINE.test(line)) {
        destination.write(`${line}\n`);
      }
    }
  });

  source.on("end", () => {
    if (buffer && !BRANDED_LOG_LINE.test(buffer)) {
      destination.write(buffer);
    }
  });
}

// Resolves to false when something is already listening on host:port so the
// caller can refuse to start rather than fall back to a different port.
function isPortAvailable(host, port) {
  return new Promise((resolve) => {
    const tester = createServer();

    // Any bind failure (EADDRINUSE when taken, EACCES on a privileged port,
    // etc.) means we can't use it, so treat the port as unavailable.
    tester.once("error", () => resolve(false));

    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });

    // Bind to the same host the server will use so the check matches reality.
    tester.listen(Number(port), host);
  });
}

// Reads and removes "--flag value" from args, returning the value (or
// undefined when the flag is absent).
function takeFlagValue(flag) {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1] ?? "";
  args.splice(index, 2);
  return value;
}

async function loadConfig(configPath) {
  if (!configPath) {
    return {};
  }

  try {
    const module = await import(pathToFileURL(configPath).href);
    return module.default ?? module ?? {};
  } catch (error) {
    console.error(`Failed to load config "${configPath}":`, error);
    return {};
  }
}

function normalizePort(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }

  return typeof value === "string" && /^\d+$/.test(value) ? value : undefined;
}

function normalizeHost(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
