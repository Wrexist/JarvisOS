export const dynamic = "force-dynamic";

import { getSessionWorkspaceId } from "@/lib/session";
import { listProjects } from "@/server/services/project.service";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const workspaceId = await getSessionWorkspaceId();
  const projects = await listProjects(workspaceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Manage active projects and track progress.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to start organizing tasks, docs, and workflows. Or convert an idea."
          actionLabel="Go to Ideas"
          actionHref="/ideas"
        />
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              stage={project.stage}
              taskCount={project._count.tasks}
              docCount={project._count.documents}
              healthScore={project.healthScore}
              updatedAt={project.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
