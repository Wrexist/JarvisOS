"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  taskTemplates: unknown[];
  docTemplates: unknown[];
}

export function TemplateSelector() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    fetch("/api/project-templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {
        toast.error("Failed to load templates");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleApply(templateId: string, templateName: string) {
    setApplying(templateId);
    try {
      const res = await fetch(`/api/project-templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim() || templateName,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const project = await res.json();
      toast.success("Project created from template");
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setApplying(null);
    }
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading templates...</p>;
  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookTemplate className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Or create from template</h4>
      </div>
      <Input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="Project name (optional, uses template name)"
        className="text-sm"
      />
      <div className="space-y-1.5">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {(t.taskTemplates as unknown[])?.length ?? 0} tasks ·{" "}
                {(t.docTemplates as unknown[])?.length ?? 0} docs
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              disabled={applying === t.id}
              onClick={() => handleApply(t.id, t.name)}
            >
              {applying === t.id ? "Creating..." : "Use"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
