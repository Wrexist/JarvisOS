/**
 * ForgeOS Desktop — Electron main process.
 *
 * Boot sequence:
 * 1. Acquire single-instance lock
 * 2. Show splash screen
 * 3. Initialize environment (AUTH_SECRET, data dir)
 * 4. Initialize PGlite (embedded PostgreSQL)
 * 5. Run migrations + seed on first launch
 * 6. Start Next.js production server
 * 7. Load the app in a BrowserWindow
 */
import * as path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import { setupDesktopEnv, getDataDir } from "./env";
import { initPGlite, closePGlite } from "./pglite-adapter";
import { applyMigrations, seedData, isFirstRun } from "./first-run";
import { startNextServer, stopNextServer, getServerPort } from "./next-server";

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Single-instance lock — prevent multiple app instances (PGlite data corruption)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    resizable: false,
    backgroundColor: "#09090b",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splash.loadFile(path.join(__dirname, "splash.html"));
  return splash;
}

function createMainWindow(port: number): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);

  win.once("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    win.show();
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

function getMigrationsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "prisma", "migrations");
  }
  return path.join(__dirname, "..", "prisma", "migrations");
}

// IPC handlers
ipcMain.handle("get-app-version", () => app.getVersion());

async function boot(): Promise<void> {
  try {
    // 1. Show splash
    splashWindow = createSplashWindow();

    // 2. Setup environment
    console.log("[main] Setting up desktop environment...");
    const config = setupDesktopEnv();
    const dataDir = getDataDir();

    // 3. Initialize PGlite
    console.log(`[main] Initializing PGlite at: ${dataDir}`);
    const firstRun = isFirstRun(dataDir);
    const db = await initPGlite(dataDir);

    // 4. Run migrations
    const migrationsPath = getMigrationsPath();
    const applied = await applyMigrations(db, migrationsPath);
    if (applied > 0) {
      console.log(`[main] Applied ${applied} migration(s)`);
    }

    // 5. Seed data on first run
    if (firstRun) {
      await seedData(db);
    }

    // 6. Start Next.js server
    console.log("[main] Starting Next.js server...");
    const port = await startNextServer({
      FORGEOS_DESKTOP: "true",
      AUTH_SECRET: config.authSecret,
      FORGEOS_DATA_DIR: dataDir,
    });

    // 7. Create main window
    mainWindow = createMainWindow(port);
  } catch (err) {
    console.error("[main] Boot failed:", err);
    app.quit();
  }
}

app.whenReady().then(boot);

app.on("window-all-closed", async () => {
  await stopNextServer();
  await closePGlite();
  app.quit();
});

app.on("before-quit", async () => {
  await stopNextServer();
  await closePGlite();
});

app.on("activate", () => {
  // macOS: re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    const port = getServerPort();
    if (port) {
      mainWindow = createMainWindow(port);
    }
  }
});
