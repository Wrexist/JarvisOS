"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  href: string;
}

export function OnboardingChecklist({
  ideaCount,
  projectCount,
  taskCount,
}: {
  ideaCount: number;
  projectCount: number;
  taskCount: number;
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("forgeos-onboarding-dismissed") === "true";
  });

  const steps: OnboardingStep[] = [
    {
      id: "idea",
      label: "Create your first idea",
      completed: ideaCount > 0,
      href: "/ideas",
    },
    {
      id: "project",
      label: "Start a project",
      completed: projectCount > 0,
      href: "/projects",
    },
    {
      id: "task",
      label: "Add tasks to a project",
      completed: taskCount > 0,
      href: "/tasks",
    },
  ];

  const allDone = steps.every((s) => s.completed);

  if (dismissed || allDone) return null;

  const completedCount = steps.filter((s) => s.completed).length;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("forgeos-onboarding-dismissed", "true");
  }

  return (
    <div className="glass-panel p-5 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Getting Started</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} complete
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="flex items-center gap-3 text-sm py-1 hover:text-foreground transition-colors"
          >
            {step.completed ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={
                step.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }
            >
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
