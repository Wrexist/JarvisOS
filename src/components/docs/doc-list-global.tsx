"use client";

import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DocTypeBadge } from "@/components/docs/doc-type-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type DocType = "PRD" | "TECH_SPEC" | "NOTES" | "RETRO" | "SCRATCHPAD";

interface DocItem {
  id: string;
  title: string;
  type: DocType;
  updatedAt: string;
  project: { id: string; name: string };
}

export function DocListGlobal({ documents }: { documents: DocItem[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      !search || doc.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-muted/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-muted/50">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="PRD">PRD</SelectItem>
            <SelectItem value="TECH_SPEC">Tech Spec</SelectItem>
            <SelectItem value="NOTES">Notes</SelectItem>
            <SelectItem value="RETRO">Retro</SelectItem>
            <SelectItem value="SCRATCHPAD">Scratchpad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">
            {documents.length === 0
              ? "No documents yet. Create docs from within a project to get started."
              : "No documents match your filters."}
          </p>
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/projects/${doc.project.id}?doc=${doc.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.project.name}
                </p>
              </div>
              <DocTypeBadge type={doc.type} />
              <span className="text-xs text-muted-foreground">
                {new Date(doc.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
