import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { app } from "electron";

export interface DesktopConfig {
  authSecret: string;
  anthropicApiKey?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "forgeos-config.json");
}

export function getDataDir(): string {
  return path.join(app.getPath("userData"), "forgeos-data");
}

function loadConfig(): DesktopConfig {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  // First run: generate auth secret
  const config: DesktopConfig = {
    authSecret: crypto.randomBytes(32).toString("hex"),
  };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return config;
}

export function setupDesktopEnv(): DesktopConfig {
  const config = loadConfig();

  process.env.FORGEOS_DESKTOP = "true";
  process.env.AUTH_SECRET = config.authSecret;
  process.env.FORGEOS_DATA_DIR = getDataDir();

  if (config.anthropicApiKey) {
    process.env.ANTHROPIC_API_KEY = config.anthropicApiKey;
  }
  if (config.githubClientId) {
    process.env.GITHUB_CLIENT_ID = config.githubClientId;
  }
  if (config.githubClientSecret) {
    process.env.GITHUB_CLIENT_SECRET = config.githubClientSecret;
  }

  return config;
}
