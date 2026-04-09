"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Lightbulb,
  FolderKanban,
  CheckSquare,
  FileText,
  Search,
} from "lucide-react";

interface SearchResults {
  ideas: Array<{ id: string; title: string; status: string }>;
  projects: Array<{ id: string; name: string; stage: string }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    project: { id: string; name: string };
  }>;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    project: { id: string };
  }>;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    }
    function handleOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  // Search on query change
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error("[ForgeOS Error] Search:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  }

  if (!open) return null;

  const hasResults =
    results &&
    (results.ideas.length > 0 ||
      results.projects.length > 0 ||
      results.tasks.length > 0 ||
      results.documents.length > 0);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[20vh] max-w-lg">
        <Command className="rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search ideas, projects, tasks..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-auto p-2">
            {loading && (
              <Command.Loading>
                <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                  Searching...
                </p>
              </Command.Loading>
            )}

            {query.length >= 2 && !loading && !hasResults && (
              <Command.Empty className="px-2 py-4 text-sm text-muted-foreground text-center">
                No results found.
              </Command.Empty>
            )}

            {query.length < 2 && !loading && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center space-y-2">
                <p>Type to search across your workspace...</p>
                <p className="text-[10px] opacity-70">
                  Filters: <code>status:blocked</code> <code>priority:high</code> <code>project:name</code> <code>type:prd</code>
                </p>
              </div>
            )}

            {results?.ideas && results.ideas.length > 0 && (
              <Command.Group heading="Ideas">
                {results.ideas.map((idea) => (
                  <Command.Item
                    key={idea.id}
                    value={idea.title}
                    onSelect={() => navigate(`/ideas/${idea.id}`)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-accent text-sm"
                  >
                    <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{idea.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {idea.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.projects && results.projects.length > 0 && (
              <Command.Group heading="Projects">
                {results.projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={project.name}
                    onSelect={() => navigate(`/projects/${project.id}`)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-accent text-sm"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.stage}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.tasks && results.tasks.length > 0 && (
              <Command.Group heading="Tasks">
                {results.tasks.map((task) => (
                  <Command.Item
                    key={task.id}
                    value={task.title}
                    onSelect={() =>
                      navigate(`/projects/${task.project.id}?task=${task.id}`)
                    }
                    className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-accent text-sm"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {task.project.name}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.documents && results.documents.length > 0 && (
              <Command.Group heading="Documents">
                {results.documents.map((doc) => (
                  <Command.Item
                    key={doc.id}
                    value={doc.title}
                    onSelect={() =>
                      navigate(`/projects/${doc.project.id}?doc=${doc.id}`)
                    }
                    className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-accent text-sm"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{doc.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {doc.type}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
