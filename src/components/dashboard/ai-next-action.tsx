"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AINextActionButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommended_action: string;
    reason: string;
  } | null>(null);

  async function handleFetch() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/next-action", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("[ForgeOS Error] AI next action:", err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFetch}
        disabled={loading}
        variant="ghost"
        size="sm"
        className="gap-1.5 h-7 text-xs"
      >
        {loading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {loading ? "Thinking..." : "Get AI Suggestion"}
      </Button>
      {result && (
        <div className="glass-panel p-3 text-sm">
          <p className="font-medium">{result.recommended_action}</p>
          <p className="text-xs text-muted-foreground mt-1">{result.reason}</p>
        </div>
      )}
    </div>
  );
}
