"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export function ProjectSettings({
  project,
}: {
  project: {
    id: string;
    name: string;
    description: string | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Project updated");
      router.refresh();
    } catch {
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    confirm({
      title: "Delete project",
      description: `Delete "${project.name}"? All tasks, docs, and activity will be permanently lost.`,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
          toast.success("Project deleted");
          router.push("/projects");
        } catch {
          toast.error("Failed to delete project");
          setDeleting(false);
        }
      },
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      <ConfirmDialog />
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          General
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete this project and all associated data.
        </p>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Project"}
        </Button>
      </div>
    </div>
  );
}
