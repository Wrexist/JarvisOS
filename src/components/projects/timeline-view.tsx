import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TimelineTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
}

const statusColor: Record<TaskStatus, string> = {
  TODO: "bg-zinc-500/50",
  IN_PROGRESS: "bg-blue-500/50",
  BLOCKED: "bg-red-500/50",
  DONE: "bg-emerald-500/50",
};

const statusOrder: Record<TaskStatus, number> = {
  BLOCKED: 0,
  IN_PROGRESS: 1,
  TODO: 2,
  DONE: 3,
};

export function TimelineView({ tasks }: { tasks: TimelineTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        No tasks yet. Add tasks to see a visual roadmap.
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.dueDate && b.dueDate)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const withDates = sorted.filter((t) => t.dueDate);
  const withoutDates = sorted.filter((t) => !t.dueDate);

  return (
    <div className="space-y-6">
      {withDates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Scheduled ({withDates.length})
          </h3>
          {withDates.map((task) => {
            const due = new Date(task.dueDate!);
            const now = new Date();
            const daysLeft = Math.ceil(
              (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0;

            return (
              <div key={task.id} className="glass-panel p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${statusColor[task.status]}`}
                    />
                    <span className="text-sm font-medium truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TaskPriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                    <span
                      className={`text-xs ${isOverdue ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysLeft)}d overdue`
                        : daysLeft === 0
                          ? "Due today"
                          : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {withoutDates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Unscheduled ({withoutDates.length})
          </h3>
          {withoutDates.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2">
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${statusColor[task.status]}`}
              />
              <span className="text-sm truncate flex-1">{task.title}</span>
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2">
        {Object.entries(statusColor).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded ${color}`} />
            {status === "IN_PROGRESS"
              ? "In Progress"
              : status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
