"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateIdeaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to create idea");

      setOpen(false);
      setTitle("");
      setDescription("");
      setTags("");
      toast.success("Idea created");
      router.refresh();
    } catch {
      toast.error("Failed to create idea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Idea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Capture a new idea</DialogTitle>
            <DialogDescription>
              Write it down before you forget. You can enrich it with AI later.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id="title"
                placeholder="What's the idea?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Optional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tags"
                className="text-sm font-medium text-foreground"
              >
                Tags
              </label>
              <Input
                id="tags"
                placeholder="ai, saas, mobile (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
