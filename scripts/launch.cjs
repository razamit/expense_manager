#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const {
  repoRoot,
  logHeader,
  logInfo,
  fail,
  getNpmInvocation,
  ensureNodeVersion,
  ensureCommand,
  ensureDirectory,
  ensureEnvFile,
  runCommand,
  spawnProcess,
  openBrowser,
} = require("./setup-shared.cjs");

const rawArgs = process.argv.slice(2);

const options = {
  forceEnv: rawArgs.includes("--force-env"),
  rebuild: rawArgs.includes("--rebuild"),
  help: rawArgs.includes("--help") || rawArgs.includes("-h"),
};

const PORT = 5000;
const APP_URL = `http://localhost:${PORT}`;
const npmInvocation = getNpmInvocation();

function main() {
  if (options.help) {
    printHelp();
    return;
  }

  process.chdir(repoRoot);
  ensureNodeVersion();
  ensureCommand(npmInvocation.command, [...npmInvocation.prefixArgs, "--version"], "npm is required to continue.");

  logHeader("Launching FinanceChecker");
  ensureDirectory("config");
  ensureEnvFile(options.forceEnv);

  const npm = (args, label) => runCommand(npmInvocation.command, [...npmInvocation.prefixArgs, ...args], label);

  installDependencies(npm);
  prepareDatabase(npm);
  buildIfNeeded(npm);
  startServer();
}

function installDependencies(npm) {
  if (fs.existsSync(path.join(repoRoot, "node_modules"))) {
    logInfo("Reusing existing node_modules (skipping npm ci).");
    return;
  }

  npm(["ci"], "Installing npm dependencies (this also downloads Chromium; first run takes a few minutes)");
}

function prepareDatabase(npm) {
  const dbExisted = fs.existsSync(path.join(repoRoot, "prisma", "dev.db"));

  npm(["run", "db:deploy"], "Applying database migrations");

  if (dbExisted) {
    logInfo("Existing database detected (skipping seed).");
    return;
  }

  npm(["run", "db:seed"], "Seeding default categories and rules");
}

function buildIfNeeded(npm) {
  const buildIdExists = fs.existsSync(path.join(repoRoot, ".next", "BUILD_ID"));

  if (buildIdExists && !options.rebuild) {
    logInfo("Reusing existing production build (skipping next build).");
    return;
  }

  npm(["run", "build"], "Building the production bundle (first run takes a few minutes)");
}

function startServer() {
  logInfo(`Starting the production server on ${APP_URL}.`);
  logInfo("Expect the master-password create screen on a fresh install. Press Ctrl+C to stop.");

  const child = spawnProcess(npmInvocation.command, [...npmInvocation.prefixArgs, "run", "start"], "Starting Next.js");

  forwardSignals(child);

  child.on("exit", (code) => {
    process.exit(code == null ? 0 : code);
  });

  waitForServer(child);
}

function forwardSignals(child) {
  const stop = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
}

function waitForServer(child, attempt = 0) {
  const maxAttempts = 150;

  if (child.exitCode !== null || attempt >= maxAttempts) {
    if (attempt >= maxAttempts) {
      logInfo(`Server did not respond after waiting. Open ${APP_URL} manually once it is ready.`);
    }
    return;
  }

  const request = http.get(APP_URL, (response) => {
    response.resume();
    logInfo(`Server is up. Opening ${APP_URL} in your browser.`);
    openBrowser(APP_URL);
  });

  request.on("error", () => {
    setTimeout(() => waitForServer(child, attempt + 1), 1000);
  });
}

function printHelp() {
  console.log(`FinanceChecker launch\n\nUsage: node scripts/launch.cjs [options]\n\nOptions:\n  --rebuild     Force a fresh production build even if one exists\n  --force-env   Recreate .env from .env.example\n  --help        Show this help message`);
}

main();
