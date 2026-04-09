/**
 * Extracts an error message from a failed fetch response or thrown error.
 * Logs full details to console so the user can copy-paste them for debugging.
 *
 * Usage:
 *   catch (err) {
 *     toast.error(await extractError(err, "Failed to create task"));
 *   }
 */
export async function extractError(
  err: unknown,
  fallback: string
): Promise<string> {
  let message = fallback;
  let details: Record<string, unknown> = {};

  if (err instanceof Response) {
    // Fetch response object passed directly
    try {
      const body = await err.json();
      message = body.error || body.message || fallback;
      details = body;
    } catch {
      message = `${fallback} (HTTP ${err.status})`;
    }
  } else if (err instanceof Error) {
    message = err.message || fallback;
    details = { stack: err.stack };
  }

  console.error(
    `[ForgeOS Error] ${fallback}\n` +
      JSON.stringify({ message, ...details, timestamp: new Date().toISOString() }, null, 2)
  );

  return message;
}

/**
 * Throws an error with the API error message if the response is not ok.
 * Use in client components:
 *   const res = await fetch(...);
 *   await throwIfNotOk(res);
 */
export async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await res.json().catch(() => null);
  throw new Error(
    body?.error || body?.message || `Request failed (${res.status})`
  );
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "3 days ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString();
}
