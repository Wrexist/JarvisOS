"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

const AVAILABLE_EVENTS = [
  "task.completed",
  "project.stage_changed",
  "idea.converted",
  "pr.merged",
];

export function WebhookConfig() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/webhooks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEndpoints(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || selectedEvents.size === 0) return;

    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          events: Array.from(selectedEvents),
          secret: secret.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      const endpoint = await res.json();
      setEndpoints((prev) => [endpoint, ...prev]);
      setCreateOpen(false);
      setUrl("");
      setSecret("");
      setSelectedEvents(new Set());
      toast.success("Webhook created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      setEndpoints((prev) =>
        prev.map((e) => (e.id === id ? { ...e, active } : e))
      );
    } catch {
      toast.error("Failed to update webhook");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading webhooks...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Outgoing Webhooks</h2>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add webhook endpoint</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    type="url"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <button
                        key={event}
                        type="button"
                        onClick={() => toggleEvent(event)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selectedEvents.has(event)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Secret <span className="text-muted-foreground font-normal">(optional, for HMAC verification)</span>
                  </label>
                  <Input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="webhook-secret"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  disabled={creating || !url.trim() || selectedEvents.size === 0}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Send HTTP POST notifications to external URLs when events occur.
      </p>

      {endpoints.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          No webhooks configured yet.
        </div>
      ) : (
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <div key={ep.id} className="glass-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-3.5 w-3.5 shrink-0 ${ep.active ? "text-emerald-400" : "text-zinc-500"}`} />
                    <p className="text-sm font-medium truncate">{ep.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {ep.events.map((ev) => (
                      <Badge key={ev} variant="outline" className="text-[10px]">
                        {ev}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleToggle(ep.id, !ep.active)}
                  >
                    {ep.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(ep.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
