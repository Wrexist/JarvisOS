"use client";

import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/generated/prisma/client";

interface CompareIdea {
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
}

const fields: { key: keyof CompareIdea; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "problem", label: "Problem" },
  { key: "targetUser", label: "Target User" },
  { key: "whyNow", label: "Why Now" },
  { key: "monetization", label: "Monetization" },
  { key: "risks", label: "Risks" },
  { key: "assumptions", label: "Assumptions" },
];

export function IdeaCompare({ ideas }: { ideas: CompareIdea[] }) {
  const highestScore = Math.max(
    ...ideas.map((i) => i.score ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Headers */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${ideas.length}, 1fr)` }}
      >
        {ideas.map((idea) => (
          <div key={idea.id} className="glass-panel p-4 space-y-2">
            <h3 className="font-semibold">{idea.title}</h3>
            <div className="flex items-center gap-2">
              <IdeaStatusBadge status={idea.status} />
              {idea.score !== null && (
                <Badge
                  variant="outline"
                  className={
                    idea.score === highestScore && highestScore > 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ""
                  }
                >
                  Score: {idea.score}
                  {idea.score === highestScore && highestScore > 0 && " ★"}
                </Badge>
              )}
            </div>
            {idea.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      {fields.map(({ key, label }) => (
        <div key={key}>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {label}
          </h4>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${ideas.length}, 1fr)`,
            }}
          >
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="glass-panel p-3 text-sm whitespace-pre-wrap"
              >
                {(idea[key] as string | null) ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Score visualization */}
      {ideas.some((i) => i.score !== null) && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Score Comparison
          </h4>
          <div className="space-y-2">
            {ideas.map((idea) => (
              <div key={idea.id} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{idea.title}</span>
                <div className="flex-1 h-6 bg-muted/20 rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${
                      idea.score === highestScore && highestScore > 0
                        ? "bg-emerald-500/50"
                        : "bg-primary/30"
                    }`}
                    style={{ width: `${idea.score ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {idea.score ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
