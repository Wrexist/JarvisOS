/**
 * GitHub App utilities.
 * Requires GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_WEBHOOK_SECRET env vars.
 * This module is only imported server-side by API routes.
 */

export function getGitHubAppConfig() {
  return {
    appId: process.env.GITHUB_APP_ID ?? "",
    privateKey: process.env.GITHUB_PRIVATE_KEY ?? "",
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  };
}

export function isGitHubConfigured(): boolean {
  return !!(
    process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY
  );
}
