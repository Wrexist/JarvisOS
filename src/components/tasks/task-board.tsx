"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { DeadlineBadge } from "@/components/tasks/deadline-badge";
import { LinkedPRIcon } from "@/components/tasks/linked-pr-badge";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  linkedPullRequest: {
    number: number;
    title: string;
    url: string;
    status: string;
  } | null;
}

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
];

export function TaskBoard({
  tasks,
  onTaskClick,
}: {
  tasks: TaskItem[];
  onTaskClick?: (taskId: string) => void;
}) {
  const router = useRouter();

  async function handleDrop(taskId: string, newStatus: TaskStatus) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update status");
      }
      router.refresh();
    } catch (err) {
      console.error("[ForgeOS Error] Task status update:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update task status");
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            className="space-y-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) handleDrop(taskId, col.status);
            }}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                {col.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[120px] rounded-lg border border-dashed border-border/50 p-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("taskId", task.id)
                  }
                  onClick={() => onTaskClick?.(task.id)}
                  className="glass-panel p-3 cursor-grab active:cursor-grabbing hover:border-zinc-700/70 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2">
                    {task.title}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <TaskPriorityBadge priority={task.priority} />
                    <DeadlineBadge dueDate={task.dueDate} />
                    {task.linkedPullRequest && (
                      <LinkedPRIcon status={task.linkedPullRequest.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
