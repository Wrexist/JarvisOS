"use client";

import { Button } from "@/components/ui/button";

export default function IdeaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass-panel p-12 text-center space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Failed to load idea details."}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
