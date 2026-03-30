export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getProject } from "@/server/services/project.service";
import { StageBadge } from "@/components/projects/stage-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) notFound();

  const serialized = {
    id: project.id,
    name: project.name,
    description: project.description,
    stage: project.stage,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    _count: project._count,
    tasks: project.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      estimateHours: t.estimateHours,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    documents: project.documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
    })),
    activities: project.activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    aiRuns: project.aiRuns.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <StageBadge stage={project.stage} />
      </div>
      <ProjectTabs project={serialized} />
    </div>
  );
}
