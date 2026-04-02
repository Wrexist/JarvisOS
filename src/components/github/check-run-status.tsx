import { CheckCircle, XCircle, Clock } from "lucide-react";

export function CheckRunsSummary({
  checkRuns,
}: {
  checkRuns: Array<{ conclusion: string; name: string }>;
}) {
  if (checkRuns.length === 0) return null;

  const passed = checkRuns.filter((c) => c.conclusion === "SUCCESS").length;
  const failed = checkRuns.filter((c) => c.conclusion === "FAILURE").length;
  const total = checkRuns.length;

  if (failed > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-400">
        <XCircle className="h-3.5 w-3.5" />
        {failed}/{total} failed
      </div>
    );
  }

  if (passed === total) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" />
        {total} passed
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-amber-400">
      <Clock className="h-3.5 w-3.5" />
      {passed}/{total} passed
    </div>
  );
}
