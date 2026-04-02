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