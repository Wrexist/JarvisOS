import { Badge } from "@/components/ui/badge";
import type { ProjectStage } from "@/generated/prisma/client";

const stageConfig: Record<ProjectStage, { label: string; className: string }> = {
  CLARIFYING: { label: "Clarifying", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  PLANNING: { label: "Planning", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  READY_TO_BUILD: { label: "Ready to Build", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  BUILDING: { label: "Building", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  TESTING: { label: "Testing", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  SHIPPED: { label: "Shipped", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  PAUSED: { label: "Paused", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  ARCHIVED: { label: "Archived", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
  const config = stageConfig[stage];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
