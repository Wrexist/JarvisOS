"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StageBadge } from "@/components/projects/stage-badge";
import { ActivityFeed } from "@/components/projects/activity-feed";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStage, TaskStatus } from "@/generated/prisma/client";

interface ProjectTabsProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    stage: ProjectStage;
    createdAt: string;
    updatedAt: string;
    _count: { tasks: number; documents: number; pullRequests: number };
    tasks: Array<{
      id: string;
      title: string;
      status: TaskStatus;
    }>;
    documents: Array<{
      id: string;
      title: string;
      type: string;
    }>;
    activities: Array<{
      id: string;
      type: string;
      message: string | null;
      createdAt: string;
    }>;
    aiRuns: Array<{
      id: string;
      type: string;
      status: string;
      createdAt: string;
    }>;
  };
}

const tabs = [
  "Overview",
  "Tasks",
  "Docs",
  "GitHub",
  "AI Runs",
  "Settings",
] as const;

type Tab = (typeof tabs)[number];

const stages: ProjectStage[] = [
  "CLARIFYING",
  "PLANNING",
  "READY_TO_BUILD",
  "BUILDING",
  "TESTING",
  "SHIPPED",
  "PAUSED",
  "ARCHIVED",
];

export function ProjectTabs({ project }: ProjectTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [changingStage, setChangingStage] = useState(false);

  async function handleStageChange(stage: string) {
    setChangingStage(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update stage:", error);
    } finally {
      setChangingStage(false);
    }
  }

  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = project.tasks.filter(
    (t) => t.status === "BLOCKED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "Tasks" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {project._count.tasks}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.tasks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {doneTasks} done · {blockedTasks} blocked
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.documents}
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-sm text-muted-foreground">Pull Requests</p>
                <p className="text-2xl font-semibold mt-1">
                  {project._count.pullRequests}
                </p>
              </div>
            </div>

            {project.description && (
              <div className="glass-panel p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Recent Activity
              </h3>
              <ActivityFeed activities={project.activities} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Stage</p>
                <Select
                  value={project.stage}
                  onValueChange={handleStageChange}
                  disabled={changingStage}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm mt-0.5">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="text-sm mt-0.5">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <p>Task management coming in Phase 5</p>
          <p className="text-xs mt-2">
            {project._count.tasks} tasks in this project
          </p>
        </div>
      )}

      {activeTab === "Docs" && (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <p>Document management coming in Phase 6</p>
          <p className="text-xs mt-2">
            {project._count.documents} documents in this project
          </p>
        </div>
      )}

      {activeTab === "GitHub" && (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          GitHub integration coming in Phase 9
        </div>
      )}

      {activeTab === "AI Runs" && (
        <div className="space-y-2">
          {project.aiRuns.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">
              No AI runs for this project yet.
            </div>
          ) : (
            project.aiRuns.map((run) => (
              <div key={run.id} className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-xs">{run.type}</Badge>
                  <span className="ml-2 text-sm text-muted-foreground">{run.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          Project settings coming in Phase 10
        </div>
      )}
    </div>
  );
}
