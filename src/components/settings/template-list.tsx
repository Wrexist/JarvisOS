"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm: confirmDelete, ConfirmDialog } = useConfirmDialog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    fetch("/api/prompt-templates")
      .then((res) => res.json())
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/prompt-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          content: newContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const template = await res.json();
      setTemplates((prev) => [template, ...prev]);
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewContent("");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleSave(id: string) {
    try {
      const res = await fetch(`/api/prompt-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, content: editContent } : t))
      );
      setEditingId(null);
    } catch {
      toast.error("Failed to save template");
    }
  }

  function handleDelete(id: string) {
    confirmDelete({
      title: "Delete template",
      description: "This prompt template will be permanently deleted.",
      onConfirm: async () => {
        const res = await fetch(`/api/prompt-templates/${id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Failed to delete template");
          return;
        }
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      },
    });
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading templates...</p>;
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prompt Templates</h2>
        <Dialog open={createOpen} onOpenChange={(open) => {
          if (!open && (newName || newContent)) {
            if (!confirm("Discard unsaved template?")) return;
          }
          setCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create prompt template</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Template name"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What this template does"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Content{" "}
                    <span className="text-muted-foreground font-normal">
                      (use {"{{variable}}"} for placeholders)
                    </span>
                  </label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Your prompt template..."
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={!newName.trim() || !newContent}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          No templates yet. Create one or run the seed script.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingId === template.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (editContent !== template.content) {
                            if (!confirm("You have unsaved changes. Discard?")) return;
                          }
                          setEditingId(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleSave(template.id)}
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(template.id);
                          setEditContent(template.content);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {editingId === template.id ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              ) : (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 max-h-32 overflow-auto">
                  {template.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
