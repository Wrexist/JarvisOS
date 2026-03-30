"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  CheckSquare,
  FileText,
  GitBranch,
  Bot,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Docs", href: "/docs", icon: FileText },
  { label: "GitHub", href: "/github", icon: GitBranch },
  { label: "AI Runs", href: "/ai-runs", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/50 bg-zinc-950/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">ForgeOS</span>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="opacity-50" />

      {/* User */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          F
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Founder</span>
          <span className="text-xs text-muted-foreground">ForgeOS</span>
        </div>
      </div>
    </aside>
  );
}
