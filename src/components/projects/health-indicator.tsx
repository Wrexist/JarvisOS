import { cn } from "@/lib/utils";

function getHealthColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function getHealthBg(score: number) {
  if (score >= 70) return "bg-emerald-500/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export function HealthIndicator({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md";
}) {
  if (score === null) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted/50",
          size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
        )}
      >
        <span className="text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        getHealthBg(score),
        getHealthColor(score),
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
      )}
    >
      {score}
    </div>
  );
}

export function HealthBar({
  score,
  factors,
}: {
  score: number;
  factors: Array<{ label: string; penalty: number; detail: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <HealthIndicator score={score} />
        <div>
          <p className="text-sm font-medium">
            Health Score: {score}/100
          </p>
          <p className="text-xs text-muted-foreground">
            {score >= 70 ? "Healthy" : score >= 40 ? "Needs attention" : "At risk"}
          </p>
        </div>
      </div>
      {factors.length > 0 && (
        <div className="space-y-1">
          {factors.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{f.detail}</span>
              <span className="text-red-400">-{f.penalty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
