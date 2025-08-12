"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/stores/hooks/useWorkspace";
import { useProject } from "@/stores/hooks/useProject";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaces, currentWorkspace, fetchWorkspaces, setCurrentWorkspace } = useWorkspace();
  const { projects, currentProject, fetchProjects, setCurrentProject } = useProject();
  const [isReady, setIsReady] = useState(false);
  const wsPerms = usePermissions('workspace', currentWorkspace?.id);

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

  // Ensure store reflects URL context (workspace/project) on direct navigation
  useEffect(() => {
    if (!pathname) return;
    const projectMatch = pathname.match(/\/projects\/(.+?)(?:$|\/)/);
    const workspaceMatch = pathname.match(/\/dashboard\/workspace\/(.+?)(?:$|\/)/);

    (async () => {
      if (projectMatch && projectMatch[1]) {
        const projectId = projectMatch[1];
        // If current project not set or different, fetch and set
        if (!currentProject || currentProject.id !== projectId) {
          const res = await fetch(`/api/projects/${projectId}`, { headers: { 'Cache-Control': 'no-cache' } });
          if (res.ok) {
            const proj = await res.json();
            setCurrentProject(proj);
            // Ensure workspace set
            const wsId: string | undefined = proj.workspaceId;
            if (wsId && (!currentWorkspace || currentWorkspace.id !== wsId)) {
              const list = workspaces.length ? workspaces : await fetchWorkspaces();
              const found = list.find(w => w.id === wsId) || null;
              if (found) setCurrentWorkspace(found);
              localStorage.setItem('siq:lastWorkspaceId', wsId);
              await fetchProjects(wsId);
            }
            localStorage.setItem('siq:lastProjectId', projectId);
          }
        }
      } else if (workspaceMatch && workspaceMatch[1]) {
        const wsId = workspaceMatch[1];
        if (!currentWorkspace || currentWorkspace.id !== wsId) {
          const list = workspaces.length ? workspaces : await fetchWorkspaces();
          const found = list.find(w => w.id === wsId) || null;
          if (found) setCurrentWorkspace(found);
          localStorage.setItem('siq:lastWorkspaceId', wsId);
          await fetchProjects(wsId);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  const [wsQuery, setWsQuery] = useState("");
  const [projQuery, setProjQuery] = useState("");
  const filteredWorkspaces = useMemo(() => {
    const list = wsQuery
      ? workspaces.filter((w) => w.name.toLowerCase().includes(wsQuery.toLowerCase()))
      : workspaces.slice(0, 3);
    return list;
  }, [workspaces, wsQuery]);

  const filteredProjects = useMemo(() => {
    console.log('Filtering projects:', { projects: projects.length, projQuery, projects });
    const list = projQuery
      ? projects.filter((p) => p.name.toLowerCase().includes(projQuery.toLowerCase()))
      : projects.slice(0, 8);
    const result = list.map((p) => ({ id: p.id, name: p.name }));
    console.log('Filtered projects result:', result);
    return result;
  }, [projects, projQuery]);

  // Local dropdown open states
  const [wsOpen, setWsOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Close if clicked outside any dropdown containers
      if (!target.closest('[data-dropdown="ws"]')) setWsOpen(false);
      if (!target.closest('[data-dropdown="proj"]')) setProjOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const isHome = pathname === '/' || pathname === '/dashboard' || pathname === '/get-started';
  const isProjectPath = /\/projects\//.test(pathname || '');
  const isWorkspacePath = /\/dashboard\/workspace\//.test(pathname || '') || /\/workspaces\/?$/.test(pathname || '');

  return (
    <nav className="sticky top-0 z-[60] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Brand + Workspace switcher: "SprintIQ / Workspace" */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="font-semibold">
            <span className="inline-block">SprintIQ</span>
          </Link>
          {!isHome && <span className="text-muted-foreground">/</span>}
          {!isHome && (
          <div className="relative" data-dropdown="ws">
            <button
              className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
              onClick={() => setWsOpen((v) => !v)}
              aria-expanded={wsOpen}
              aria-haspopup="menu"
            >
              <span className="font-medium">{currentWorkspace?.name || 'Select workspace'}</span>
              <ChevronsUpDown className="h-4 w-4" />
            </button>
            {wsOpen && (
            <div className="absolute left-0 top-full z-[70] mt-1 w-80 rounded border bg-popover p-2 text-sm shadow-md">
              <div className="flex items-center gap-2 rounded border bg-background px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces"
                  value={wsQuery}
                  onChange={(e) => setWsQuery(e.target.value)}
                  className="h-7 border-0 focus-visible:ring-0"
                />
              </div>
              <div className="mt-2 max-h-64 overflow-auto">
                {filteredWorkspaces.map((w) => (
                  <button
                    key={w.id}
                    className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent"
                    onClick={async () => {
                      setCurrentWorkspace(w);
                      localStorage.setItem("siq:lastWorkspaceId", w.id);
                      console.log('Fetching projects for workspace:', w.id, w.name);
                      await fetchProjects(w.id);
                      console.log('Projects after fetch:', projects);
                      router.push(`/dashboard/workspace/${w.id}`);
                      setWsOpen(false);
                    }}
                  >
                    <span className="truncate" title={w.name}>{w.name}</span>
                    {currentWorkspace?.id === w.id && <span className="text-xs text-muted-foreground">current</span>}
                  </button>
                ))}
                {filteredWorkspaces.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No workspaces found</div>
                )}
              </div>
              <div className="mt-2 border-t pt-2">
                <button
                  className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                  onClick={() => router.push('/workspaces')}
                >
                  View all workspaces
                </button>
              </div>
              {wsPerms.canCreate && (
                <div className="mt-2 border-t pt-2">
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                    onClick={() => router.push('/workspaces/new')}
                  >
                    + Create workspace
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
          )}

          {/* Project Switcher inline */}
          {currentWorkspace && isProjectPath && (
            <>
              <span className="text-muted-foreground">/</span>
              <div className="relative" data-dropdown="proj">
                <button
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                  onClick={() => setProjOpen((v) => !v)}
                  aria-expanded={projOpen}
                  aria-haspopup="menu"
                >
                  <span className="font-medium">{(typeof window !== 'undefined' && (projects.find(p => p.id === localStorage.getItem('siq:lastProjectId'))?.name)) || currentProject?.name || 'Select project'}</span>
                  <ChevronsUpDown className="h-4 w-4" />
                </button>
                {projOpen && (
                <div className="absolute left-0 top-full z-[70] mt-1 w-96 rounded border bg-popover p-2 text-sm shadow-md">
                  <div className="flex items-center gap-2 rounded border bg-background px-2 py-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects"
                      value={projQuery}
                      onChange={(e) => setProjQuery(e.target.value)}
                      className="h-7 border-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="mt-2 max-h-64 overflow-auto">
                    {filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent"
                        onClick={() => {
                          const proj = projects.find(x => x.id === p.id) || null;
                          setCurrentProject(proj);
                          if (proj) {
                            localStorage.setItem('siq:lastProjectId', proj.id);
                            router.push(`/projects/${proj.id}`);
                            setProjOpen(false);
                          }
                        }}
                      >
                        <span className="truncate" title={p.name}>{p.name}</span>
                      </button>
                    ))}
                    {filteredProjects.length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">No projects found</div>
                    )}
                  </div>
                  {wsPerms.canCreate && (
                    <div className="mt-2 border-t pt-2">
                      <button
                        className="w-full rounded px-2 py-1 text-left hover:bg-accent"
                        onClick={() => router.push('/projects/new' + (currentWorkspace ? `?workspaceId=${currentWorkspace.id}` : ''))}
                      >
                        + Create project
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Removed old standalone Projects dropdown; handled inline above */}

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