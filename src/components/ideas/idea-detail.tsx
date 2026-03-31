"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CommentSection } from "@/components/comments/comment-list";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import { EnrichButton } from "@/components/ideas/enrich-button";
import { ConvertButton } from "@/components/ideas/convert-button";
import type { IdeaStatus } from "@/generated/prisma/client";

interface AIRunItem {
  id: string;
  type: string;
  status: string;
  output: string | null;
  createdAt: string;
}

interface IdeaDetailProps {
  idea: {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    problem: string | null;
    targetUser: string | null;
    whyNow: string | null;
    monetization: string | null;
    risks: string | null;
    assumptions: string | null;
    score: number | null;
    status: IdeaStatus;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    project: { id: string; name: string; slug: string } | null;
    aiRuns: AIRunItem[];
  };
}

function DetailField({
  label,
  value,
  editing,
  field,
  onChange,
  multiline,
}: {
  label: string;
  value: string | null;
  editing: boolean;
  field: string;
  onChange: (field: string, value: string) => void;
  multiline?: boolean;
}) {
  if (editing) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        {multiline ? (
          <Textarea
            value={value ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
          />
        )}
      </div>
    );
  }

  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function IdeaDetail({ idea }: IdeaDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fields, setFields] = useState({
    title: idea.title,
    summary: idea.summary ?? "",
    description: idea.description ?? "",
    problem: idea.problem ?? "",
    targetUser: idea.targetUser ?? "",
    whyNow: idea.whyNow ?? "",
    monetization: idea.monetization ?? "",
    risks: idea.risks ?? "",
    assumptions: idea.assumptions ?? "",
  });

  function handleFieldChange(field: string, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
      router.push("/ideas");
    } catch (error) {
      toast.error("Something went wrong");
      setDeleting(false);
    }
  }

  const isConverted = idea.status === "CONVERTED";
  const canConvert = !isConverted && idea.status !== "ARCHIVED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={fields.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="text-2xl font-semibold"
            />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">
              {idea.title}
            </h1>
          )}
          <div className="mt-2 flex items-center gap-3">
            <IdeaStatusBadge status={idea.status} />
            {idea.score !== null && (
              <Badge variant="outline" className="gap-1">
                Score: {idea.score}
              </Badge>
            )}
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Linked project */}
      {idea.project && (
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Converted to project
            </p>
            <p className="font-medium">{idea.project.name}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${idea.project!.id}`)}
          >
            View Project
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isConverted && <EnrichButton ideaId={idea.id} />}
        {canConvert && <ConvertButton ideaId={idea.id} />}
      </div>

      <Separator />

      {/* Detail fields */}
      <div className="grid gap-5 md:grid-cols-2">
        <DetailField
          label="Summary"
          value={editing ? fields.summary : idea.summary}
          editing={editing}
          field="summary"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Description"
          value={editing ? fields.description : idea.description}
          editing={editing}
          field="description"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Problem"
          value={editing ? fields.problem : idea.problem}
          editing={editing}
          field="problem"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Target User"
          value={editing ? fields.targetUser : idea.targetUser}
          editing={editing}
          field="targetUser"
          onChange={handleFieldChange}
        />
        <DetailField
          label="Why Now"
          value={editing ? fields.whyNow : idea.whyNow}
          editing={editing}
          field="whyNow"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Monetization"
          value={editing ? fields.monetization : idea.monetization}
          editing={editing}
          field="monetization"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Risks"
          value={editing ? fields.risks : idea.risks}
          editing={editing}
          field="risks"
          onChange={handleFieldChange}
          multiline
        />
        <DetailField
          label="Assumptions"
          value={editing ? fields.assumptions : idea.assumptions}
          editing={editing}
          field="assumptions"
          onChange={handleFieldChange}
          multiline
        />
      </div>

      {/* Comments */}
      <Separator />
      <CommentSection ideaId={idea.id} />

      {/* AI Run History */}
      {idea.aiRuns.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">AI Enrichment History</h2>
            <div className="space-y-2">
              {idea.aiRuns.map((run) => (
                <div key={run.id} className="glass-panel p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {run.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {run.output && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto">
                      {run.output}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
