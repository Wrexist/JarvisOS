import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/generated/prisma/client";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To Do", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  BLOCKED: { label: "Blocked", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  DONE: { label: "Done", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
