"use client";

import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { DeadlineBadge } from "@/components/tasks/deadline-badge";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  estimateHours: number | null;
  dueDate: string | null;
}

export function TaskList({
  tasks,
  onTaskClick,
}: {
  tasks: TaskItem[];
  onTaskClick?: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        No tasks yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="glass-panel divide-y divide-border/50">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onTaskClick?.(task.id)}
          className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
            <DeadlineBadge dueDate={task.dueDate} />
          </div>
        </div>
      ))}
    </div>
  );
}
