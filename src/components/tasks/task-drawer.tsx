"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CommentSection } from "@/components/comments/comment-list";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GeneratePromptButton } from "@/components/tasks/generate-prompt-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  status: TaskStatus;
  priority: Priority;
  estimateHours: number | null;
  dueDate: string | null;
  relevantFiles: string[];
  createdAt: string;
  project: { id: string; name: string } | null;
}

export function TaskDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setSaving] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }

    setLoading(true);
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => setTask(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!taskId) return null;

  async function handleUpdate(field: string, value: unknown) {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask((prev) => (prev ? { ...prev, ...updated } : prev));
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!task) return;
    try {
      await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTask((prev) => (prev ? { ...prev, status: status as TaskStatus } : prev));
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onClose();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border/50 bg-background shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold truncate">
            {loading ? "Loading..." : task?.title ?? "Task"}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={!task}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {task && (
          <div className="flex-1 overflow-auto p-6 space-y-5">
            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={task.priority}
                  onValueChange={(v) => handleUpdate("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input
                value={task.title}
                onChange={(e) =>
                  setTask((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev
                  )
                }
                onBlur={(e) => handleUpdate("title", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Description
              </label>
              <Textarea
                value={task.description ?? ""}
                onChange={(e) =>
                  setTask((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
                onBlur={(e) =>
                  handleUpdate("description", e.target.value || null)
                }
                rows={4}
                placeholder="Task details..."
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Acceptance Criteria
              </label>
              <Textarea
                value={task.acceptanceCriteria ?? ""}
                onChange={(e) =>
                  setTask((prev) =>
                    prev
                      ? { ...prev, acceptanceCriteria: e.target.value }
                      : prev
                  )
                }
                onBlur={(e) =>
                  handleUpdate("acceptanceCriteria", e.target.value || null)
                }
                rows={3}
                placeholder="What defines done?"
              />
            </div>

            {/* Estimate + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Estimate (hours)
                </label>
                <Input
                  type="number"
                  value={task.estimateHours ?? ""}
                  onChange={(e) =>
                    setTask((prev) =>
                      prev
                        ? {
                            ...prev,
                            estimateHours: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }
                        : prev
                    )
                  }
                  onBlur={(e) =>
                    handleUpdate(
                      "estimateHours",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={
                    task.dueDate
                      ? new Date(task.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdate("dueDate", e.target.value || null)
                  }
                />
              </div>
            </div>

            {/* Relevant Files */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Relevant Files
              </label>
              <Input
                value={task.relevantFiles.join(", ")}
                onBlur={(e) =>
                  handleUpdate(
                    "relevantFiles",
                    e.target.value
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="src/app/page.tsx, src/lib/utils.ts"
              />
            </div>

            {/* Claude Prompt */}
            <Separator />
            <GeneratePromptButton taskId={task.id} />

            {/* Comments */}
            <Separator />
            <CommentSection taskId={task.id} />

            {/* Meta */}
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              {task.project && <p>Project: {task.project.name}</p>}
              <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
