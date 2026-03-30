export const dynamic = "force-dynamic";

import { getSessionWorkspaceId } from "@/lib/session";
import { listAllTasks } from "@/server/services/task.service";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import Link from "next/link";

export default async function TasksPage() {
  const workspaceId = await getSessionWorkspaceId();
  const tasks = await listAllTasks(workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          All tasks across your projects.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          No tasks yet. Create tasks from a project.
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.project.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.project.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
