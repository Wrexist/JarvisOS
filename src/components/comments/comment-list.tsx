"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/format";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

export function CommentSection({
  taskId,
  ideaId,
}: {
  taskId?: string;
  ideaId?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const param = taskId ? `taskId=${taskId}` : `ideaId=${ideaId}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comments?${param}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [param]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          taskId,
          ideaId,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
            >
              <p className="whitespace-pre-wrap">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatRelativeTime(c.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !newComment.trim()}
          className="shrink-0 self-end"
        >
          {submitting ? "..." : "Post"}
        </Button>
      </form>
    </div>
  );
}
