export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { IdeaCompare } from "@/components/ideas/idea-compare";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function IdeaComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;

  if (!ids) {
    return (
      <div className="glass-panel p-12 text-center space-y-4">
        <p className="text-muted-foreground">
          Select 2-4 ideas from the Ideas page to compare.
        </p>
        <Link href="/ideas">
          <Button variant="outline">Go to Ideas</Button>
        </Link>
      </div>
    );
  }

  const ideaIds = ids.split(",").slice(0, 4);
  const workspaceId = await getSessionWorkspaceId();

  const ideas = await prisma.idea.findMany({
    where: { id: { in: ideaIds }, workspaceId },
  });

  if (ideas.length < 2) {
    return (
      <div className="glass-panel p-12 text-center space-y-4">
        <p className="text-muted-foreground">
          Need at least 2 ideas to compare.
        </p>
        <Link href="/ideas">
          <Button variant="outline">Go to Ideas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ideas">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Compare Ideas
          </h1>
          <p className="text-sm text-muted-foreground">
            {ideas.length} ideas side by side
          </p>
        </div>
      </div>
      <IdeaCompare ideas={ideas} />
    </div>
  );
}
