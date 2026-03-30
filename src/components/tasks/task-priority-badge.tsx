import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/generated/prisma/client";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  MEDIUM: { label: "Medium", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  HIGH: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  URGENT: { label: "Urgent", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function TaskPriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
