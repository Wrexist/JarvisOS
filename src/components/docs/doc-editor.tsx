"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Pencil, Sparkles, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocTypeBadge } from "@/components/docs/doc-type-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentType, Priority } from "@/generated/prisma/client";

interface DocData {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: string;
  acceptanceCriteria: string;
  selected: boolean;
}

export function DocEditor({
  documentId,
  projectId,
  onBack,
}: {
  documentId: string;
  projectId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [specTasks, setSpecTasks] = useState<GeneratedTask[]>([]);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [specCreating, setSpecCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => setDoc(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  const save = useCallback(
    async (data: Partial<DocData>) => {
      if (!doc) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? "Failed to save");
        }
        router.refresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [doc, router]
  );

  async function handleGenerateFromSpec() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/spec-to-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      if (!data.tasks || data.tasks.length === 0) {
        toast.error("AI didn't generate any tasks. Try adding more detail to the spec.");
        return;
      }
      setSpecTasks(
        data.tasks.map((t: Omit<GeneratedTask, "selected">) => ({
          ...t,
          selected: true,
        }))
      );
      setSpecDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateSpecTasks() {
    const selected = specTasks.filter((t) => t.selected);
    if (selected.length === 0) return;
    setSpecCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: selected.map((t) => ({
            title: t.title,
            description: t.description,
            priority: t.priority,
            acceptanceCriteria: t.acceptanceCriteria,
          })),
        }),
      });
      if (!res.ok) throw new Error("Batch creation failed");
      setSpecDialogOpen(false);
      setSpecTasks([]);
      toast.success(`${selected.length} task${selected.length !== 1 ? "s" : ""} created from spec`);
      router.refresh();
    } catch {
      toast.error("Failed to create tasks");
    } finally {
      setSpecCreating(false);
    }
  }

  function toggleSpecTask(index: number) {
    setSpecTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  }

  const selectedSpecCount = specTasks.filter((t) => t.selected).length;

  if (loading) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        Loading document...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="glass-panel p-8 text-center text-muted-foreground">
        Document not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        {doc.type === "TECH_SPEC" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7"
            disabled={generating}
            onClick={handleGenerateFromSpec}
          >
            {generating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generating ? "Generating..." : "Generate Tasks"}
          </Button>
        )}
        <DocTypeBadge type={doc.type} />
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
          <Button
            variant={mode === "edit" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("edit")}
            className="gap-1.5 h-7 px-2.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("preview")}
            className="gap-1.5 h-7 px-2.5"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
        {saving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {!saving && saved && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* Title */}
      <Input
        value={doc.title}
        onChange={(e) => setDoc((prev) => prev ? { ...prev, title: e.target.value } : prev)}
        onBlur={(e) => save({ title: e.target.value })}
        className="text-lg font-semibold bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto"
      />

      {/* Editor / Preview */}
      {mode === "edit" ? (
        <Textarea
          value={doc.content}
          onChange={(e) =>
            setDoc((prev) => prev ? { ...prev, content: e.target.value } : prev)
          }
          onBlur={(e) => save({ content: e.target.value })}
          className="min-h-[500px] font-mono text-sm resize-y"
          placeholder="Write markdown here..."
        />
      ) : (
        <div className="glass-panel p-6 prose prose-invert prose-sm max-w-none min-h-[500px]">
          {doc.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.content}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">No content yet.</p>
          )}
        </div>
      )}

      {/* Spec-to-Tasks Review Dialog */}
      <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Tasks from Spec</DialogTitle>
            <DialogDescription>
              Review and select which tasks to add. {selectedSpecCount} of{" "}
              {specTasks.length} selected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-4">
            {specTasks.map((task, i) => (
              <div
                key={i}
                onClick={() => toggleSpecTask(i)}
                className={`glass-panel p-4 cursor-pointer transition-colors ${
                  task.selected ? "border-primary/30" : "opacity-50"
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
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSpecDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSpecTasks}
              disabled={specCreating || selectedSpecCount === 0}
            >
              {specCreating
                ? "Creating..."
                : `Create ${selectedSpecCount} Task${selectedSpecCount !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
