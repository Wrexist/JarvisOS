"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EnrichButton({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnrich() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/idea-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Enrichment failed");
      }

      toast.success("Idea enriched successfully");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleEnrich}
        disabled={loading}
        variant="secondary"
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? "Enriching..." : "AI Enrich"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
