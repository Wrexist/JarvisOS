import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function getHealthLabel(score: number) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Needs attention";
  return "At risk";
}

interface HealthFactor {
  label: string;
  penalty: number;
  detail: string;
}

export function HealthIndicator({
  score,
  factors,
  size = "md",
}: {
  score: number | null;
  factors?: HealthFactor[];
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
        <span className="text-muted-foreground">&mdash;</span>
      </div>
    );
  }

  const indicator = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold cursor-default",
        getHealthBg(score),
        getHealthColor(score),
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
      )}
    >
      {score}
    </div>
  );

  if (!factors || factors.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs font-medium">{getHealthLabel(score)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64">
          <p className="text-xs font-medium mb-1.5">{getHealthLabel(score)}</p>
          <div className="space-y-1">
            {factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{f.detail}</span>
                <span className="text-destructive shrink-0">-{f.penalty}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
