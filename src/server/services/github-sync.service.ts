import { prisma } from "@/lib/prisma";

/**
 * Upserts a repository record from GitHub webhook/sync data.
 */
export async function upsertRepository(
  workspaceId: string,
  data: {
    fullName: string;
    owner: string;
    name: string;
    defaultBranch?: string;
    isPrivate?: boolean;
    installationId?: string;
  }
) {
  return prisma.repository.upsert({
    where: { fullName: data.fullName },
    update: {
      defaultBranch: data.defaultBranch,
      isPrivate: data.isPrivate,
      installationId: data.installationId,
    },
    create: {
      fullName: data.fullName,
      owner: data.owner,
      name: data.name,
      defaultBranch: data.defaultBranch,
      isPrivate: data.isPrivate ?? true,
      installationId: data.installationId,
      workspaceId,
    },
  });
}

/**
 * Connects a repository to a project.
 */
export async function connectRepoToProject(
  projectId: string,
  repositoryId: string
) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { repositoryId },
  });

  await prisma.activityEvent.create({
    data: {
      type: "project.repo_connected",
      message: "Repository connected to project",
      projectId,
    },
  });

  return project;
}

/**
 * Lists pull requests for a repository.
 */
export async function listRepoPullRequests(repositoryId: string) {
  return prisma.pullRequest.findMany({
    where: { repositoryId },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Lists repositories for a workspace.
 */
export async function listRepositories(workspaceId: string) {
  return prisma.repository.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}
