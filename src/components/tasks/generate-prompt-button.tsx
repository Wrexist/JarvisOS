"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Code, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GeneratePromptButton({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/task-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) throw new Error("Failed to generate prompt");
      const data = await res.json();
      setPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        <Code className="h-3.5 w-3.5" />
        {loading ? "Generating..." : "Generate Claude Prompt"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {prompt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Generated prompt
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 h-7"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="text-xs bg-muted/30 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-auto border border-border/50">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
