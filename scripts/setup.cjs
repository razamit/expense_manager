#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
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
  ensureEnvFile();

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

function getNpmInvocation() {
  if (process.platform !== "win32") {
    return {
      command: "npm",
      prefixArgs: [],
    };
  }

  const bundledPowerShellShim = path.join(path.dirname(process.execPath), "npm.ps1");

  if (fs.existsSync(bundledPowerShellShim)) {
    return {
      command: "powershell.exe",
      prefixArgs: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", bundledPowerShellShim],
    };
  }

  return {
    command: "npm",
    prefixArgs: [],
  };
}

function ensureNodeVersion() {
  const [major] = process.versions.node.split(".").map(Number);

  if (major >= 18) {
    return;
  }

  fail(`Node.js 18 or newer is required. Detected ${process.versions.node}.`);
}

function ensureCommand(command, args, errorMessage) {
  const result = runProcess(command, args, "ignore");

  if (result.error || result.status !== 0) {
    fail(errorMessage);
  }
}

function ensureDirectory(relativePath) {
  const targetPath = path.join(repoRoot, relativePath);

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    logInfo(`Created ${relativePath}${path.sep}`);
    return;
  }

  logInfo(`Reusing ${relativePath}${path.sep}`);
}

function ensureEnvFile() {
  const envPath = path.join(repoRoot, ".env");
  const envExamplePath = path.join(repoRoot, ".env.example");

  if (!fs.existsSync(envExamplePath)) {
    fail("Missing .env.example. The setup flow cannot continue.");
  }

  if (fs.existsSync(envPath) && !options.forceEnv) {
    logInfo("Reusing existing .env");
    return;
  }

  const action = fs.existsSync(envPath) ? "Recreated" : "Created";
  fs.copyFileSync(envExamplePath, envPath);
  logInfo(`${action} .env from .env.example`);
}

function runCommand(command, args, label) {
  logStep(label);

  const result = runProcess(command, args, "inherit");

  if (result.error) {
    fail(`${label} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}.`);
  }
}

function runProcess(command, args, stdio) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    stdio,
    shell: false,
    env: process.env,
  });
}

function logHeader(message) {
  console.log(`\n== ${message} ==`);
}

function logStep(message) {
  console.log(`\n--> ${message}`);
}

function logInfo(message) {
  console.log(`[setup] ${message}`);
}

function fail(message) {
  console.error(`\n[setup] ${message}`);
  process.exit(1);
}

main();