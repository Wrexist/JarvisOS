"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, GitCompareArrows } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/ideas/idea-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdeaStatus } from "@/generated/prisma/client";

interface IdeaListItem {
  id: string;
  title: string;
  summary: string | null;
  status: IdeaStatus;
  score: number | null;
  tags: string[];
  createdAt: string;
}

export function IdeaList({ ideas }: { ideas: IdeaListItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }

  function handleCompare() {
    if (selected.size >= 2) {
      router.push(`/ideas/compare?ids=${Array.from(selected).join(",")}`);
    }
  }

  const filtered = ideas.filter((idea) => {
    const matchesSearch =
      !search ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.summary?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || idea.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-muted/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-muted/50">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="INBOX">Inbox</SelectItem>
            <SelectItem value="REVIEWING">Reviewing</SelectItem>
            <SelectItem value="VALIDATED">Validated</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        {selected.size >= 2 ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCompare}
            className="gap-1.5"
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            Compare ({selected.size})
          </Button>
        ) : (
          ideas.length >= 2 && (
            <span className="text-xs text-muted-foreground">
              Select 2-4 ideas to compare
            </span>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">
            {ideas.length === 0
              ? "No ideas yet. Capture your first one!"
              : "No ideas match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((idea) => (
            <div key={idea.id} className="flex items-start gap-2">
              <button
                onClick={(e) => { e.preventDefault(); toggleSelect(idea.id); }}
                className={`mt-5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  selected.has(idea.id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {selected.has(idea.id) && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <IdeaCard
                  id={idea.id}
                  title={idea.title}
                  summary={idea.summary}
                  status={idea.status}
                  score={idea.score}
                  tags={idea.tags}
                  createdAt={idea.createdAt}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
