"use client";

import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ClaudeMdGenerator() {
  const [projectName, setProjectName] = useState("ForgeOS");
  const [stack, setStack] = useState(
    "Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind, shadcn/ui"
  );
  const [rules, setRules] = useState(
    "Prefer clarity over cleverness\nUse strict TypeScript\nKeep route handlers thin\nPut business logic in services"
  );
  const [copied, setCopied] = useState(false);

  const generated = `# ${projectName} Project Rules

## Product
${projectName} - AI-native product execution system.

## Stack
${stack
  .split(",")
  .map((s) => `- ${s.trim()}`)
  .join("\n")}

## Engineering rules
${rules
  .split("\n")
  .filter(Boolean)
  .map((r) => `- ${r.trim()}`)
  .join("\n")}

## UI rules
- Premium dark UI
- Clear hierarchy
- Minimal clutter
- Rounded panels
- Strong spacing

## Data rules
- Prisma schema is source of truth
- Enums must be used consistently
- Major actions should create ActivityEvent records
`;

  async function handleCopy() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCode className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">CLAUDE.md Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Generate a CLAUDE.md file for your project to guide Claude Code.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Stack (comma-separated)
            </label>
            <Input
              value={stack}
              onChange={(e) => setStack(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Engineering Rules (one per line)
            </label>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Preview</label>
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
          <pre className="text-xs bg-muted/30 rounded-lg p-3 whitespace-pre-wrap max-h-80 overflow-auto border border-border/50">
            {generated}
          </pre>
        </div>
      </div>
    </div>
  );
}
