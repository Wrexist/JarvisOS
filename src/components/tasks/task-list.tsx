"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { DeadlineBadge } from "@/components/tasks/deadline-badge";
import { LinkedPRBadge } from "@/components/tasks/linked-pr-badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  estimateHours: number | null;
  dueDate: string | null;
  linkedPullRequest: {
    number: number;
    title: string;
    url: string;
    status: string;
  } | null;
}

export function TaskList({
  tasks,
  onTaskClick,
}: {
  tasks: TaskItem[];
  onTaskClick?: (taskId: string) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  function toggleSelect(taskId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === tasks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tasks.map((t) => t.id)));
    }
  }

  async function handleBulkStatus(status: string) {
    setBulkLoading(true);
    try {
      await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [...selected], status }),
      });
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkPriority(priority: string) {
    setBulkLoading(true);
    try {
      await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [...selected], priority }),
      });
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleBulkDelete() {
    confirm({
      title: "Delete tasks",
      description: `Delete ${selected.size} selected task${selected.size !== 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        setBulkLoading(true);
        try {
          await fetch("/api/tasks/bulk", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskIds: [...selected] }),
          });
          setSelected(new Set());
          router.refresh();
        } catch {
          toast.error("Bulk delete failed");
        } finally {
          setBulkLoading(false);
        }
      },
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        No tasks yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ConfirmDialog />

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-xs font-medium">
            {selected.size} selected
          </span>
          <Select
            onValueChange={handleBulkStatus}
            disabled={bulkLoading}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleBulkPriority}
            disabled={bulkLoading}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Set priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={handleBulkDelete}
            disabled={bulkLoading}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="glass-panel divide-y divide-border/50">
        {/* Select all header */}
        <div className="flex items-center gap-3 px-4 py-2">
          <input
            type="checkbox"
            checked={selected.size === tasks.length && tasks.length > 0}
            onChange={toggleAll}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} of ${tasks.length}`
              : `${tasks.length} tasks`}
          </span>
        </div>

        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(task.id)}
              onChange={() => toggleSelect(task.id)}
              className="h-3.5 w-3.5 rounded border-border accent-primary shrink-0"
            />
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => onTaskClick?.(task.id)}
            >
              <p className="text-sm font-medium truncate">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {task.linkedPullRequest && (
                <LinkedPRBadge
                  prNumber={task.linkedPullRequest.number}
                  prTitle={task.linkedPullRequest.title}
                  prUrl={task.linkedPullRequest.url}
                  prStatus={task.linkedPullRequest.status}
                />
              )}
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              <DeadlineBadge dueDate={task.dueDate} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
