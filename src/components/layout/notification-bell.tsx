"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch((err) => console.error("Failed to fetch notifications:", err));
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when dropdown opens so data is always fresh
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications([]);
    } catch {
      // keep current state on failure
    }
    setOpen(false);
  }

  async function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // keep current state on failure
    }
  }

  function handleClick(n: Notification) {
    if (n.href) {
      router.push(n.href);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleMarkAllRead}
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No new notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="group flex items-start gap-2 px-4 py-3 hover:bg-muted/30 cursor-pointer border-b border-border/30 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDismiss(e, n.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
