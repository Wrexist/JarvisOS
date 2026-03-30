import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/generated/prisma/client";

const statusConfig: Record<
  IdeaStatus,
  { label: string; className: string }
> = {
  INBOX: {
    label: "Inbox",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  REVIEWING: {
    label: "Reviewing",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  VALIDATED: {
    label: "Validated",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  CONVERTED: {
    label: "Converted",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
};

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
