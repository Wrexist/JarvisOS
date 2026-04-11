/**
 * Manages the Next.js production server as a child process.
 * Finds a free port, spawns `node server.js`, and health-checks until ready.
 */
import * as net from "net";
import * as path from "path";
import * as http from "http";
import { fork, ChildProcess } from "child_process";
import { app } from "electron";

let serverProcess: ChildProcess | null = null;
let serverPort: number | null = null;

/** Find a free port by briefly binding to port 0. */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("Could not determine port")));
      }
    });
    server.on("error", reject);
  });
}

/** Health-check poll until the Next.js server responds. */
function waitForServer(port: number, maxAttempts = 60): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          reject(new Error(`Server not healthy after ${maxAttempts} attempts`));
        }
      });
      req.on("error", () => {
        if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          reject(new Error(`Server not reachable after ${maxAttempts} attempts`));
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, 500);
        }
      });
    };

    check();
  });
}

/** Get the path to the standalone Next.js server.js. */
function getServerPath(): string {
  if (app.isPackaged) {
    // In production, the standalone build is inside the app resources
    return path.join(process.resourcesPath, "standalone", "server.js");
  }
  // In development, use the project's .next/standalone/server.js
  return path.join(__dirname, "..", ".next", "standalone", "server.js");
}

/** Start the Next.js server and return the port. */
export async function startNextServer(env: Record<string, string>): Promise<number> {
  const port = await findFreePort();
  const serverPath = getServerPath();

  console.log(`[next-server] Starting on port ${port}: ${serverPath}`);

  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      ...env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    },
    stdio: "pipe",
  });

  serverProcess.stdout?.on("data", (data) => {
    console.log(`[next-server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on("data", (data) => {
    console.error(`[next-server] ${data.toString().trim()}`);
  });

  serverProcess.on("exit", (code) => {
    console.log(`[next-server] Process exited with code ${code}`);
    serverProcess = null;
  });

  await waitForServer(port);
  serverPort = port;
  console.log(`[next-server] Ready at http://127.0.0.1:${port}`);
  return port;
}

/** Get the current server port. */
export function getServerPort(): number | null {
  return serverPort;
}

/** Stop the Next.js server. */
export async function stopNextServer(): Promise<void> {
  if (serverProcess) {
    console.log("[next-server] Stopping...");
    serverProcess.kill("SIGTERM");
    // Give it a moment to shut down gracefully
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill("SIGKILL");
        }
        resolve();
      }, 5000);

      serverProcess?.on("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    serverProcess = null;
    serverPort = null;
  }
}
