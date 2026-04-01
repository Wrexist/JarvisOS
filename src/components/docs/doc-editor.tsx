"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocTypeBadge } from "@/components/docs/doc-type-badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentType } from "@/generated/prisma/client";

interface DocData {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
}

export function DocEditor({
  documentId,
  onBack,
}: {
  documentId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);

  async function handleGenerateTasks() {
    if (!doc) return;
    setGeneratingTasks(true);
    try {
      const res = await fetch("/api/ai/spec-to-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast.success(`Generated ${data.tasks?.length ?? 0} task suggestions`);
      router.refresh();
    } catch {
      toast.error("Failed to generate tasks from spec");
    } finally {
      setGeneratingTasks(false);
    }
  }

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
        await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [doc, router]
  );

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
            variant="secondary"
            size="sm"
            className="gap-1.5 h-7"
            onClick={handleGenerateTasks}
            disabled={generatingTasks}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generatingTasks ? "Generating..." : "Generate Tasks"}
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
          <span className="text-xs text-muted-foreground">Saving...</span>
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
    </div>
  );
}
