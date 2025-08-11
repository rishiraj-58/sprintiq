## Role-Based UI Implementation Plan (Owner, Manager, Member, Viewer)

This plan translates the high-level spec in `docs/ROLE_BASED_UI_SPEC.md` into concrete implementation work. It defines what each role should see/do across Navbar, Sidebar, Dashboards, and Unique Pages, how capabilities gate UI and APIs, and a detailed rollout checklist.

---

### 1) Capability model (source of truth)

- Capabilities used: `view`, `create`, `edit`, `delete`, `manage_members`, `manage_settings`.
- Enforced at two layers:
  - API: All sensitive routes check capabilities (already implemented in most routes).
  - UI: Components use `usePermissions(contextType, contextId)` to hide/show actions.
- Project content access requires project membership (no workspace fallback for project data), per `src/lib/permissions.ts` policy.

Contexts used in UI:
- Workspace context: workspace-wide pages, cards, and actions.
- Project context: per-project pages and actions.

---

### 2) Global UI patterns

- Navbar (compact, Supabase-like):
  - Workspace switcher with quick “Create workspace”.
  - Project pills for the current workspace with “+ Create project”.
  - Search, Notifications, User menu.
  - Quick actions appear based on capabilities (e.g., create project, plan sprint).
- Sidebar: Contextual to workspace/project; sections hidden unless user has capability.
- AI Assistant: Visible to all, but actions are permission-gated.

Files primarily affected:
- `src/components/layout/Navbar.tsx`
- `src/components/layout/DashboardNav.tsx`
- `src/app/dashboard/...` and `src/app/projects/...`

---

### 3) Owner (Role: owner)

Navbar
- Full workspace switcher; can create workspace and project.
- Project pills across selected workspace.

Sidebar (workspace context)
- Overview, Workspaces, Projects, Team, Reports, Settings, Billing, Audit Logs.
- All create/manage actions enabled.

Dashboard (Owner)
- KPI cards (usage, members, throughput), billing/usage, risk/health, invites, audit stream.

Unique pages
- Billing & Plans, Audit Logs, Workspace Settings with permissions matrix, branding, security, integrations.

Key UI gates
- Show all items/actions; hide only if specifically restricted by feature flags.

---

### 4) Manager (Role: manager)

Navbar
- Switch accessible workspaces, project pills with managed projects first.
- Quick links: Reports; Plan Sprint.

Sidebar (workspace context)
- Overview, Projects (with health badges), Sprints, Team (capacity), Reports, Settings (project defaults).

Dashboard (Manager)
- Sprint burndown, workload heatmap, overdue/blockers, project health tiles, quick actions (start/close sprint, assign tasks, create milestones).

Unique pages
- Sprint Planner, Workload & Capacity, Operational Reports.

Key UI gates
- Create/edit/delete sprints, milestones, releases; manage team at project level; no billing.

---

### 5) Member (Role: member)

Navbar
- Current + recent workspaces; pills prioritizing projects they participate in.

Sidebar (workspace context)
- My Work, Tasks, Projects (participating), Bugs, Backlog (if allowed), Documents.

Dashboard (Member)
- Today/This week, blockers, assigned bugs, recent activity, quick actions (log work, change status, add subtask).

Unique pages
- Focus Mode, My Activity, Personal Preferences.

Key UI gates
- Can update tasks (status, due dates, sprint assignment). No team or billing pages.

---

### 6) Viewer (Role: viewer)

Navbar
- Read-only view; no create actions.

Sidebar (workspace context)
- Overview, Projects (read-only), Reports (read-only). No Team/Settings/Billing menus.

Dashboard (Viewer)
- Project status, tasks summary, bug summary, recent updates (read-only).

Unique pages
- Reports Gallery and read-only project pages.

Key UI gates
- Hide all mutation actions; no dialogs that produce side effects.

---

### 7) Component wiring and patterns

- Permissions utility: `src/hooks/usePermissions.ts` + server `src/lib/permissions.ts`.
- Patterns
  - Protected action button: render only if `canCreate`/`canEdit`/etc.
  - Protected routes/sections: return `null` or an `AccessDenied` component.
  - Merge workspace+project permissions in project pages to unlock manager/member UX (already applied in project detail and tasks detail pages).
- Data preloading
  - Navbar persists current workspace/project in Zustand + localStorage.
  - Compact project list endpoint: `/api/workspaces/[workspaceId]/projects/compact`.

---

### 8) Pages and layouts to adapt

- Workspace dashboard: `src/app/dashboard/workspace/[workspaceId]/page.tsx` and client; show role-specific widgets.
- Project detail: `src/app/projects/[projectId]/*` with left sidebar tabs; conditionally render controls.
- Global Sidebar: `src/components/layout/DashboardNav.tsx` – dynamic sections per role.
- Navbar: `src/components/layout/Navbar.tsx` – quick actions appear per capability.

---

### 9) Testing plan (UI + API)

- Role snapshots (per role) for Navbar/Sidebar, ensuring hidden links/actions.
- Click-paths for managers/members creating/assigning tasks, creating sprints, modifying timeline.
- View-only assertions for Viewer.
- API: Exercise capability checks across projects/workspaces for create/edit/delete.

---

### 10) Rollout plan

1) Owner/Manager core nav + sprints: deliver first for maximum impact.
2) Member productivity UX (My Work, bulk actions).
3) Viewer read-only pages.
4) Reports and billing pages.

---

### 11) Detailed checklist

Global
- [x] Navbar: workspace switcher create action gated by `create` (workspace context)
- [x] Navbar: project add button gated by `create` (workspace context)
- [x] Sidebar: hide menu sections based on capabilities
- [ ] AI actions: permission-gated per capability

Owner
- [x] Sidebar shows Workspaces, Team, Reports, Settings, Billing, Audit Logs
- [x] Owner dashboard widgets: billing/usage, invitations, audit
- [x] Workspace settings UI: permissions matrix visible

Manager
- [x] Sidebar shows Sprints, Team (capacity), Reports
- [x] Manager dashboard widgets: burndown, workload heatmap, health tiles
- [x] Sprint planner page with capacity hints

Member
- [ ] Sidebar shows My Work, Tasks, Backlog (if allowed), Documents
- [ ] Member dashboard widgets: Today/This week, blockers, activity
- [ ] Focus Mode page

Viewer
- [ ] Sidebar only Overview, Projects (read-only), Reports (read-only)
- [ ] Viewer dashboard widgets: status summaries only
- [ ] Read-only project pages (no mutation controls)

Project pages
- [ ] Project Overview: owner/manager controls visible; viewer read-only
- [ ] Tasks tab: member can edit tasks; viewer cannot
- [ ] Timeline tab: edit controls (sprints/milestones) hidden unless `edit`
- [ ] Team tab: visible only with `manage_members`
- [ ] Settings tab: visible only with `manage_settings`

Navbar/Sidebar integration
- [x] Workspace switch persists and rehydrates current workspace
- [x] Project pills reflect role visibility and selection; create gated by `create`

API enforcement (must stay consistent)
- [ ] All project content APIs require project membership with `view`
- [ ] Mutations require appropriate capability; no workspace fallback for project content

QA & Accessibility
- [ ] Keyboard navigation for menus and quick actions
- [ ] Meaningful empty/loading/error states per role

Documentation
- [ ] Update `ROLE_BASED_UI_SPEC.md` cross-links from this plan
- [ ] Record known limitations and follow-ups

---

If you want, I can start with Manager sidebar + dashboard widgets next, followed by Owner billing and Viewer read-only validations.


