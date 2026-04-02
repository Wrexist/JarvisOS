import { CheckCircle, XCircle, Clock, AlertTriangle, MinusCircle } from "lucide-react";
import type { CheckConclusion } from "@/generated/prisma/client";

const conclusionConfig: Record<
  CheckConclusion,
  { icon: typeof CheckCircle; className: string; label: string }
> = {
  SUCCESS: { icon: CheckCircle, className: "text-emerald-400", label: "Passed" },
  FAILURE: { icon: XCircle, className: "text-red-400", label: "Failed" },
  NEUTRAL: { icon: MinusCircle, className: "text-zinc-400", label: "Neutral" },
  CANCELLED: { icon: XCircle, className: "text-zinc-500", label: "Cancelled" },
  SKIPPED: { icon: MinusCircle, className: "text-zinc-500", label: "Skipped" },
  TIMED_OUT: { icon: Clock, className: "text-amber-400", label: "Timed Out" },
  ACTION_REQUIRED: { icon: AlertTriangle, className: "text-amber-400", label: "Action Required" },
  STALE: { icon: Clock, className: "text-zinc-500", label: "Stale" },
  STARTUP_FAILURE: { icon: XCircle, className: "text-red-400", label: "Startup Failure" },
  UNKNOWN: { icon: Clock, className: "text-zinc-500", label: "Pending" },
};

export function CheckRunStatus({
  conclusion,
  name,
}: {
  conclusion: CheckConclusion;
  name?: string;
}) {
  const config = conclusionConfig[conclusion];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${config.className}`} />
      {name && <span className="text-xs text-muted-foreground">{name}</span>}
    </div>
  );
}

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
