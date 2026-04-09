"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BookTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectForTemplate {
  id: string;
  name: string;
  description: string | null;
}

export function SaveAsTemplate({
  project,
  taskCount,
  docCount,
}: {
  project: ProjectForTemplate;
  taskCount: number;
  docCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${project.name} Template`);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // Fetch current tasks and docs
      const [tasksRes, docsRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/tasks`),
        fetch(`/api/projects/${project.id}/documents`),
      ]);

      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const docs = docsRes.ok ? await docsRes.json() : [];

      const taskTemplates = (Array.isArray(tasks) ? tasks : []).map(
        (t: { title: string; description: string | null; priority: string; acceptanceCriteria: string | null }) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          acceptanceCriteria: t.acceptanceCriteria,
        })
      );

      const docTemplates = (Array.isArray(docs) ? docs : []).map(
        (d: { title: string; type: string }) => ({
          title: d.title,
          type: d.type,
        })
      );

      const res = await fetch("/api/project-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: project.description,
          taskTemplates,
          docTemplates,
        }),
      });

      if (!res.ok) throw new Error("Failed to save template");

      setOpen(false);
      toast.success("Template saved");
    } catch (err) {
      console.error("[ForgeOS Error] Save template:", err); toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookTemplate className="h-4 w-4" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save project as template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this project&apos;s structure.
            Includes {taskCount} tasks and {docCount} documents.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Template Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
