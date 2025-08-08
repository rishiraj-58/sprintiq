"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/stores/hooks/useWorkspace";
import { useProject } from "@/stores/hooks/useProject";
import { useRouter } from "next/navigation";

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

        {/* Workspace Switcher */}
        <div className="hidden md:flex items-center">
          <select
            className="text-sm rounded border bg-background px-2 py-1"
            value={currentWorkspace?.id || ''}
            onChange={async (e) => {
              const next = workspaces.find((w) => w.id === e.target.value) || null;
              setCurrentWorkspace(next);
              if (next) {
                await fetchProjects(next.id);
              }
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Project Pills */}
        <div className="ml-2 hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
          {isReady && projectPills.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setCurrentProject(projects.find((x) => x.id === p.id) || null);
                router.push(`/projects/${p.id}`);
              }}
              className="rounded-full border px-2 py-1 text-xs hover:bg-accent"
              title={p.name}
            >
              {p.short}
            </button>
          ))}
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