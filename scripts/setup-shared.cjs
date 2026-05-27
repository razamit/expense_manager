"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");

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

function getNpmInvocation() {
  if (process.platform !== "win32") {
    return { command: "npm", prefixArgs: [] };
  }

  const bundledPowerShellShim = path.join(path.dirname(process.execPath), "npm.ps1");

  if (fs.existsSync(bundledPowerShellShim)) {
    return {
      command: "powershell.exe",
      prefixArgs: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", bundledPowerShellShim],
    };
  }

  return { command: "npm", prefixArgs: [] };
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

function ensureEnvFile(forceEnv) {
  const envPath = path.join(repoRoot, ".env");
  const envExamplePath = path.join(repoRoot, ".env.example");

  if (!fs.existsSync(envExamplePath)) {
    fail("Missing .env.example. The setup flow cannot continue.");
  }

  if (fs.existsSync(envPath) && !forceEnv) {
    logInfo("Reusing existing .env");
    return;
  }

  const action = fs.existsSync(envPath) ? "Recreated" : "Created";
  fs.copyFileSync(envExamplePath, envPath);
  logInfo(`${action} .env from .env.example`);
}

function runProcess(command, args, stdio) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    stdio,
    shell: false,
    env: process.env,
  });
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

function spawnProcess(command, args, label) {
  logStep(label);

  return spawn(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
}

function openBrowser(url) {
  const map = {
    win32: { command: "cmd", args: ["/c", "start", "", url] },
    darwin: { command: "open", args: [url] },
  };
  const invocation = map[process.platform] || { command: "xdg-open", args: [url] };

  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    stdio: "ignore",
    shell: false,
    env: process.env,
  });

  if (result.error) {
    logInfo(`Could not open the browser automatically. Open ${url} manually.`);
  }
}

module.exports = {
  repoRoot,
  logHeader,
  logStep,
  logInfo,
  fail,
  getNpmInvocation,
  ensureNodeVersion,
  ensureCommand,
  ensureDirectory,
  ensureEnvFile,
  runProcess,
  runCommand,
  spawnProcess,
  openBrowser,
};
