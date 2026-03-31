"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import type { Priority } from "@/generated/prisma/client";

interface GeneratedTask {
  title: string;
  description: string;
  priority: string;
  acceptanceCriteria: string;
  selected: boolean;
}

export function GenerateTasksButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      if (data.tasks.length === 0) {
        setError("AI didn't generate any tasks. Try adding more project description.");
        return;
      }

      setTasks(data.tasks.map((t: Omit<GeneratedTask, "selected">) => ({ ...t, selected: true })));
      setDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreate() {
    const selected = tasks.filter((t) => t.selected);
    if (selected.length === 0) return;

    setCreating(true);
    try {
      // Create tasks one by one (bulk endpoint could be added later)
      for (const task of selected) {
        await fetch(`/api/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            acceptanceCriteria: task.acceptanceCriteria,
          }),
        });
      }

      setDialogOpen(false);
      setTasks([]);
      toast.success(`${selected.length} tasks created`);
      router.refresh();
    } catch {
      toast.error("Failed to create tasks");
    } finally {
      setCreating(false);
    }
  }

  function toggleTask(index: number) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  }

  const selectedCount = tasks.filter((t) => t.selected).length;

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={generating}
        variant="secondary"
        size="sm"
        className="gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {generating ? "Generating..." : "AI Generate Tasks"}
      </Button>

      {error && !dialogOpen && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>AI-Generated Tasks</DialogTitle>
            <DialogDescription>
              Review and select which tasks to add to your project.
              {selectedCount} of {tasks.length} selected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            {tasks.map((task, i) => (
              <div
                key={i}
                onClick={() => toggleTask(i)}
                className={`glass-panel p-4 cursor-pointer transition-colors ${
                  task.selected
                    ? "border-primary/30"
                    : "opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      task.selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {task.selected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{task.title}</p>
                      {["LOW", "MEDIUM", "HIGH", "URGENT"].includes(
                        task.priority
                      ) && (
                        <TaskPriorityBadge
                          priority={task.priority as Priority}
                        />
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    {task.acceptanceCriteria && (
                      <p className="text-xs text-muted-foreground mt-1">
                        AC: {task.acceptanceCriteria}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || selectedCount === 0}
            >
              {creating
                ? "Creating..."
                : `Create ${selectedCount} Task${selectedCount !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
