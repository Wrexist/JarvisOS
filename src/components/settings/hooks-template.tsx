"use client";

import { useState } from "react";
import { Copy, Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOOKS_TEMPLATE = `{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        {
          "type": "command",
          "command": "pnpm lint"
        }
      ]
    }
  ]
}`;

export function HooksTemplate() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(HOOKS_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Claude Hooks Template</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        A <code>.claude/hooks.json</code> template that runs lint after every
        file edit.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-end">
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
        <pre className="text-xs bg-muted/30 rounded-lg p-3 whitespace-pre-wrap border border-border/50">
          {HOOKS_TEMPLATE}
        </pre>
      </div>
    </div>
  );
}
