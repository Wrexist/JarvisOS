"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConvertButton({
  ideaId,
  disabled,
}: {
  ideaId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ideas/${ideaId}/convert`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      toast.success("Converted to project");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleConvert}
        disabled={loading || disabled}
        className="gap-2"
      >
        <ArrowRight className="h-4 w-4" />
        {loading ? "Converting..." : "Convert to Project"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
