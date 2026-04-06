"use client";

import { useState } from "react";
import { Search, Plus, Lightbulb, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CreateIdeaDialog } from "@/components/ideas/create-idea-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

function NewMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setMenuOpen(!menuOpen)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </Button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-border bg-background shadow-xl py-1">
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  setIdeaDialogOpen(true);
                }}
              >
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                New Idea
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  setProjectDialogOpen(true);
                }}
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                New Project
              </button>
            </div>
          </>
        )}
      </div>
      <CreateIdeaDialog open={ideaDialogOpen} onOpenChange={setIdeaDialogOpen} />
      <CreateProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </>
  );
}

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
                new CustomEvent("open-command-palette")
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
              new CustomEvent("open-command-palette")
            );
          }}
        >
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <NotificationBell />
        <NewMenu />
      </div>
    </header>
  );
}
