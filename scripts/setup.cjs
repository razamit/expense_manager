#!/usr/bin/env node

"use strict";

const {
  repoRoot,
  logHeader,
  logInfo,
  getNpmInvocation,
  ensureNodeVersion,
  ensureCommand,
  ensureDirectory,
  ensureEnvFile,
  runCommand,
} = require("./setup-shared.cjs");

const rawArgs = process.argv.slice(2);

const options = {
  noStart: rawArgs.includes("--no-start"),
  skipInstall: rawArgs.includes("--skip-install"),
  forceEnv: rawArgs.includes("--force-env"),
  help: rawArgs.includes("--help") || rawArgs.includes("-h"),
};

const npmInvocation = getNpmInvocation();

function main() {
  if (options.help) {
    printHelp();
    return;
  }

  process.chdir(repoRoot);
  ensureNodeVersion();
  ensureCommand(npmInvocation.command, [...npmInvocation.prefixArgs, "--version"], "npm is required to continue.");

  logHeader("Preparing FinanceChecker");
  ensureDirectory("config");
  ensureEnvFile(options.forceEnv);

  if (!options.skipInstall) {
    runCommand(npmInvocation.command, [...npmInvocation.prefixArgs, "ci"], "Installing npm dependencies");
  } else {
    logInfo("Skipping npm install because --skip-install was provided.");
  }

  runCommand(npmInvocation.command, [...npmInvocation.prefixArgs, "run", "db:setup"], "Preparing the SQLite database");

  if (options.noStart) {
    logInfo("Setup complete. Dev server was not started because --no-start was provided.");
    logInfo("When you are ready, run `npm run dev` and open http://localhost:5000.");
    return;
  }

  logInfo("Setup complete. Starting the dev server on http://localhost:5000.");
  logInfo("Expect the first-launch master password screen if this is a fresh install.");
  runCommand(npmInvocation.command, [...npmInvocation.prefixArgs, "run", "dev"], "Starting the Next.js dev server");
}

function printHelp() {
  console.log(`FinanceChecker setup\n\nUsage: node scripts/setup.cjs [options]\n\nOptions:\n  --no-start      Prepare the repo and database without starting the dev server\n  --skip-install  Skip npm ci and reuse the current node_modules\n  --force-env     Recreate .env from .env.example\n  --help          Show this help message`);
}

main();
