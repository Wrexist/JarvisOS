#!/usr/bin/env node
/**
 * Cross-platform startup script for ForgeOS.
 *
 * Replaces start.bat / start.sh so that users can run "node start.js"
 * without triggering Windows Smart App Control (which blocks .bat files
 * downloaded from the internet).
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ensure we run from the project root regardless of cwd
process.chdir(path.dirname(__filename));

const isWin = process.platform === "win32";

function log(msg) {
  console.log(`  ${msg}`);
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function commandExists(name) {
  try {
    execSync(isWin ? `where ${name}` : `command -v ${name}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

// ── Banner ───────────────────────────────────────────────────────
console.log();
log("============================================");
log("  ForgeOS - AI-Native Product Execution App");
log("============================================");
console.log();

// ── Check Node.js version >= 20 ──────────────────────────────────
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor < 20) {
  log(`[ERROR] Node.js 20+ required. Found: v${process.versions.node}`);
  log("Please update from https://nodejs.org/");
  process.exit(1);
}
log(`[OK] Node.js v${process.versions.node} found`);

// ── Check / install pnpm ─────────────────────────────────────────
if (!commandExists("pnpm")) {
  log("[..] Installing pnpm...");
  try {
    run("npm install -g pnpm");
  } catch {
    log("[ERROR] Failed to install pnpm. Run: npm install -g pnpm");
    process.exit(1);
  }
}
log("[OK] pnpm found");

// ── Install dependencies (first run) ─────────────────────────────
if (!fs.existsSync("node_modules")) {
  console.log();
  log("[..] First run - installing dependencies...");
  log("     This may take a few minutes.");
  console.log();
  run("pnpm install");
  log("[OK] Dependencies installed");
} else {
  log("[OK] Dependencies already installed");
}

// ── Build Next.js (first run or after changes) ───────────────────
if (!fs.existsSync(path.join(".next", "standalone", "server.js"))) {
  console.log();
  log("[..] Building ForgeOS...");
  log("     This may take a minute.");
  console.log();
  run("pnpm build");
  log("[OK] Build complete");
} else {
  log("[OK] Build already exists");
}

// ── Compile Electron (first run) ─────────────────────────────────
if (!fs.existsSync(path.join("electron", "dist", "main.js"))) {
  log("[..] Compiling desktop app...");
  run("npx tsc -p electron/tsconfig.json");
  log("[OK] Desktop app compiled");
} else {
  log("[OK] Desktop app already compiled");
}

// ── Launch ───────────────────────────────────────────────────────
console.log();
log("============================================");
log("  Launching ForgeOS...");
log("============================================");
console.log();
log("Login: founder@forgeos.dev / forgeos123");
console.log();

const child = spawn("npx", ["electron", "electron/dist/main.js"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
