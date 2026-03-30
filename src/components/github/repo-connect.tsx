"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RepoConnect({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/repository`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to connect");
      }

      setFullName("");
      toast.success("Done"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleConnect} className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Connect a Repository</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Enter a GitHub repository in the format <code>owner/repo</code>.
      </p>
      <div className="flex gap-2">
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="owner/repo"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !fullName.includes("/")}>
          {loading ? "Connecting..." : "Connect"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
