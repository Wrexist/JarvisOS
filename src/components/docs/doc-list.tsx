"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocTypeBadge } from "@/components/docs/doc-type-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DocumentType } from "@/generated/prisma/client";

interface DocItem {
  id: string;
  title: string;
  type: DocumentType;
  updatedAt: string;
}

export function DocList({
  documents,
  projectId,
  onDocSelect,
}: {
  documents: DocItem[];
  projectId: string;
  onDocSelect: (docId: string) => void;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>("NOTES");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), type }),
      });
      if (!res.ok) throw new Error("Failed to create document");

      const doc = await res.json();
      setCreateOpen(false);
      setTitle("");
      onDocSelect(doc.id);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleGenerateSpec() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/spec-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("Spec generation failed");

      const { document } = await res.json();
      onDocSelect(document.id);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(docId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Doc
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create document</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as DocumentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRD">PRD</SelectItem>
                      <SelectItem value="TECH_SPEC">Tech Spec</SelectItem>
                      <SelectItem value="NOTES">Notes</SelectItem>
                      <SelectItem value="RETRO">Retro</SelectItem>
                      <SelectItem value="SCRATCHPAD">Scratchpad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={!title.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={handleGenerateSpec}
          disabled={generating}
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating..." : "Generate MVP Spec"}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          No documents yet. Create one or generate a spec.
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onDocSelect(doc.id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.title}</p>
              </div>
              <DocTypeBadge type={doc.type} />
              <span className="text-xs text-muted-foreground">
                {new Date(doc.updatedAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => handleDelete(doc.id, e)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
