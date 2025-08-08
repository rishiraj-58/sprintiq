"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/stores/hooks/useWorkspace";
import { useProject } from "@/stores/hooks/useProject";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const { workspaces, currentWorkspace, fetchWorkspaces, setCurrentWorkspace } = useWorkspace();
  const { projects, fetchProjects, setCurrentProject } = useProject();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const ws = workspaces.length ? workspaces : await fetchWorkspaces();
        // restore last selection
        const lastWsId = localStorage.getItem("siq:lastWorkspaceId");
        const selected = ws.find((w) => w.id === lastWsId) || ws[0] || null;
        if (selected && (!currentWorkspace || currentWorkspace.id !== selected.id)) {
          setCurrentWorkspace(selected);
        }
        if (selected) {
          await fetchProjects(selected.id);
        }
      } finally {
        setIsReady(true);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem("siq:lastWorkspaceId", currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const projectPills = useMemo(() => {
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      short: p.name.length <= 8 ? p.name : p.name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase(),
    }));
  }, [projects]);

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="font-semibold">
          <span className="inline-block rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">SprintIQ</span>
        </Link>

        {/* Workspace Switcher (Supabase-like) */}
        <div className="hidden md:flex items-center">
          <div className="relative group">
            <button className="flex items-center gap-2 rounded border px-2 py-1 text-sm hover:bg-accent">
              <span className="font-medium">{currentWorkspace?.name || 'Select workspace'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 mt-1 w-64 rounded border bg-popover p-1 text-sm opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100">
              <div className="max-h-64 overflow-auto">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent"
                    onClick={async () => {
                      setCurrentWorkspace(w);
                      localStorage.setItem("siq:lastWorkspaceId", w.id);
                      await fetchProjects(w.id);
                      // navigate to projects list for selected workspace
                      router.push('/projects?workspaceId=' + w.id);
                    }}
                  >
                    <span>{w.name}</span>
                    {currentWorkspace?.id === w.id && <span className="text-xs text-muted-foreground">current</span>}
                  </button>
                ))}
              </div>
              <div className="mt-1 border-t pt-1">
                <button
                  className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                  onClick={() => router.push('/workspaces/new')}
                >
                  + Create workspace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Dropdown (Supabase-like) */}
        <div className="ml-2 hidden md:flex items-center">
          <div className="relative group">
            <button className="flex items-center gap-2 rounded border px-2 py-1 text-sm hover:bg-accent">
              <span className="font-medium">Projects</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 mt-1 w-72 rounded border bg-popover p-1 text-sm opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100">
              <div className="max-h-64 overflow-auto">
                {projectPills.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent"
                    onClick={() => {
                      setCurrentProject(projects.find((x) => x.id === p.id) || null);
                      router.push(`/projects/${p.id}`);
                    }}
                  >
                    <span className="truncate" title={p.name}>{p.name}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px]">{p.short}</span>
                  </button>
                ))}
              </div>
              <div className="mt-1 border-t pt-1">
                <button
                  className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                  onClick={() => router.push('/projects/new')}
                >
                  + Create project
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <SignedOut>
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              afterMultiSessionSingleSignOutUrl="/"
              afterSwitchSessionUrl="/dashboard"
              signInUrl="/auth/sign-in"
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}