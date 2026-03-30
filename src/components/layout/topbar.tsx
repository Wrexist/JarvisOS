"use client";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-zinc-950/60 px-4 lg:px-6 backdrop-blur-xl gap-3">
      <MobileSidebar />
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search... (⌘K)"
            className="h-8 w-64 bg-muted/50 pl-8 text-sm"
            readOnly
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                })
              );
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-8 w-8"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              })
            );
          }}
        >
          <Search className="h-4 w-4" />
        </Button>
        <NotificationBell />
        <Button size="sm" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>
    </header>
  );
}
