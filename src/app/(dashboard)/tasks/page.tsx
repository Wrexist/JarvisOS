export const dynamic = "force-dynamic";

import { getSessionWorkspaceId } from "@/lib/session";
import { listAllTasks } from "@/server/services/task.service";
import { TaskListGlobal } from "@/components/tasks/task-list-global";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const workspaceId = await getSessionWorkspaceId();
  const tasks = await listAllTasks(workspaceId);

  const serialized = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    project: task.project,
    linkedPullRequest: task.linkedPullRequest
      ? { status: task.linkedPullRequest.status }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          All tasks across your projects.
        </p>
      </div>
      <TaskListGlobal tasks={serialized} />
    </div>
  );
}
