"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatRelativeTime } from "@/lib/format";

interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { confirm: confirmDelete, ConfirmDialog } = useConfirmDialog();

  const param = taskId ? `taskId=${taskId}` : `ideaId=${ideaId}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comments?${param}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {
        toast.error("Failed to load comments");
      })
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

  async function handleEdit(commentId: string) {
    if (!editContent.trim() || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) throw new Error("Failed");

      const updated = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setActionLoading(false);
    }
  }

  function handleDelete(commentId: string) {
    if (actionLoading) return;
    confirmDelete({
      title: "Delete comment",
      description: "This comment will be permanently deleted.",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/comments/${commentId}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Failed");

          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast.success("Comment deleted");
        } catch {
          toast.error("Failed to delete comment");
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function isEdited(c: Comment) {
    return c.updatedAt && c.createdAt !== c.updatedAt;
  }

  return (
    <div className="space-y-3">
      <ConfirmDialog />
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
              className="group rounded-lg bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {c.authorName ?? "Anonymous"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(c.createdAt)}
                </span>
                {isEdited(c) && (
                  <span className="text-[10px] text-muted-foreground italic">
                    (edited)
                  </span>
                )}
                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditContent(c.content);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-300"
                    disabled={actionLoading}
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {editingId === c.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => handleEdit(c.id)}
                      disabled={!editContent.trim() || actionLoading}
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent("");
                      }}
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{c.content}</p>
              )}
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
