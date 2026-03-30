"use client";

import { useState } from "react";
import { LayoutList, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks/task-list";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
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

export function TaskView({
  tasks,
  projectId,
}: {
  tasks: TaskItem[];
  projectId: string;
}) {
  const [view, setView] = useState<"list" | "board">("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="gap-1.5 h-7 px-2.5"
          >
            <Kanban className="h-3.5 w-3.5" />
            Board
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="gap-1.5 h-7 px-2.5"
          >
            <LayoutList className="h-3.5 w-3.5" />
            List
          </Button>
        </div>
        <CreateTaskDialog projectId={projectId} />
      </div>

      {view === "board" ? (
        <TaskBoard tasks={tasks} onTaskClick={setSelectedTaskId} />
      ) : (
        <TaskList tasks={tasks} onTaskClick={setSelectedTaskId} />
      )}

      {selectedTaskId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskDrawer
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        </>
      )}
    </div>
  );
}
