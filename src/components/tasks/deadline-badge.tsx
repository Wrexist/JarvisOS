import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeadlineBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let label: string;
  let colorClass: string;

  if (diffDays < 0) {
    label = `${Math.abs(diffDays)}d overdue`;
    colorClass = "text-red-400 bg-red-500/10 border-red-500/20";
  } else if (diffDays === 0) {
    label = "Due today";
    colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  } else if (diffDays <= 3) {
    label = `Due in ${diffDays}d`;
    colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  } else {
    label = `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    colorClass = "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        colorClass
      )}
    >
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
