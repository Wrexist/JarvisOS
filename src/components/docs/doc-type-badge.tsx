import { Badge } from "@/components/ui/badge";
import type { DocumentType } from "@/generated/prisma/client";

const typeConfig: Record<DocumentType, { label: string; className: string }> = {
  PRD: { label: "PRD", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  TECH_SPEC: { label: "Tech Spec", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  NOTES: { label: "Notes", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  RETRO: { label: "Retro", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  SCRATCHPAD: { label: "Scratchpad", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export function DocTypeBadge({ type }: { type: DocumentType }) {
  const config = typeConfig[type];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
