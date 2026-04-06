"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { DeadlineBadge } from "@/components/tasks/deadline-badge";
import { LinkedPRIcon } from "@/components/tasks/linked-pr-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  project: { id: string; name: string };
  linkedPullRequest: { status: string } | null;
}

export function TaskListGlobal({ tasks }: { tasks: TaskItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filtered = tasks.filter((task) => {
    const matchesSearch =
      !search || task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
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
            {TASK_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-muted/50">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <p className="text-muted-foreground">
            {tasks.length === 0
              ? "No tasks yet. Create tasks from within a project to get started."
              : "No tasks match your filters."}
          </p>
          {tasks.length === 0 && (
            <Link href="/projects">
              <Button variant="outline" size="sm">Go to Projects</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.project.id}?task=${task.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.project.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.linkedPullRequest && (
                  <LinkedPRIcon status={task.linkedPullRequest.status} />
                )}
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <DeadlineBadge dueDate={task.dueDate} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
