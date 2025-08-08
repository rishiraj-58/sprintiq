## Role‑Based UI Specification (Navbar, Sidebar, Dashboards, Unique Pages)

This document defines what each role sees across the top Navbar, left Sidebar, the main Dashboard, and other unique pages. Roles: Owner, Manager, Member, Viewer.

Assumptions
- The app uses a compact top navbar with a Workspace switcher and Project pills.
- Visibility follows capabilities: view, create, edit, delete, manage_members, manage_settings.

---

## Global UI Patterns (applies to all)

- Navbar base: Brand at left, Workspace Switcher (dropdown), Project Pills (horizontal, scrollable), Search, Notifications, User Menu.
- Project pills: Short names/initials; clicking routes to `/projects/[projectId]`.
- Sidebar base: Contextual to current workspace/project; actions hidden when capability is missing.
- AI Assistant: visible to all; actions gated by capability (e.g., task creation requires create).

---

## Owner

### Navbar
- Workspace Switcher: All owned/accessible workspaces; “Create workspace” quick action.
- Project Pills: All projects across selected workspace.
- Global Items: Search, Notifications, User Menu with Admin, Billing, Settings.

### Sidebar
- Overview: Owner overview page.
- Workspaces: List + Create Workspace and Workspace Settings.
- Projects: All projects; quick + New project.
- Team: Members, roles, invitations.
- Reports: KPIs, usage, growth.
- Settings: Workspace and org-level settings (branding, security, integrations).
- Billing: Plans, invoices, usage limits.
- Audit Logs: System/administrative activity.

### Dashboard (Owner)
- KPI cards: Active projects, members, tasks throughput, bug trend.
- Billing/Usage: Current plan, seat usage, upcoming invoice.
- Risk & Health: At-risk projects, overdue counts.
- Invitations: Pending invites; resend/revoke.
- Audit stream: Recent admin changes.

### Unique Pages
- Billing & Plans: Plan selection, invoices, payment methods.
- Audit Logs: Filterable by actor, entity, time.
- Workspace Settings: Permissions matrix, branding, security, integrations.

---

## Manager

### Navbar
- Workspace Switcher: Accessible workspaces.
- Project Pills: Managed projects first; then others.
- Global Items: Search, Notifications, Reports quick link, Plan Sprint quick action.

### Sidebar
- Overview: Manager overview page.
- Projects: Project list with health badges.
- Sprints: Sprint planning/active sprints.
- Team: Workload & capacity, reassign suggestions.
- Reports: Velocity, burndown, overdue, risks.
- Settings: Project defaults (where they manage); no billing.

### Dashboard (Manager)
- Sprint burndown: Active sprint trend.
- Workload heatmap: Members × load with rebalance suggestions.
- Overdue & Blockers: Queue with quick assign.
- Project health: Status tiles by project.
- Quick actions: Start/close sprint, assign tasks, create milestones.

### Unique Pages
- Sprint Planner: Capacity, scope suggestions, auto-grouping by priority.
- Workload & Capacity: Drag-and-drop assignment; conflict warnings.
- Operational Reports: Exportable weekly summaries.

---

## Member

### Navbar
- Workspace Switcher: Current + recent.
- Project Pills: Assigned/participating projects first.
- Global Items: Search, Notifications, My Work shortcut, AI quick add (task/bug).

### Sidebar
- My Work: Today, This week, Overdue.
- Tasks: Assigned to me, Created by me, Mentions.
- Projects: Participating projects list.
- Bugs: Reported/assigned bugs.
- Backlog: Read/write access if allowed.
- Documents: Recent docs in projects I’m on.

### Dashboard (Member)
- Today/This week: Focus list with due dates.
- My blockers: Tasks waiting on others; ping suggestion.
- Assigned bugs: Severity and SLA.
- Recent activity: Mentions and comments.
- Quick actions: Log work, change status, add subtask.

### Unique Pages
- Focus Mode: Minimal UI for deep work; keyboard shortcuts.
- My Activity: Stream of my updates; personal stats.
- Personal Preferences: Notifications, theme, keyboard.

---

## Viewer

### Navbar
- Workspace Switcher: Accessible workspaces only.
- Project Pills: Read-only projects.
- Global Items: Search; limited Notifications; no create actions.

### Sidebar
- Overview: Read-only status overview.
- Projects: Project list; read-only details.
- Reports: View-only KPI dashboards.
- No Team management, Settings, or Billing.

### Dashboard (Viewer)
- Project status: Active projects with on-track/at-risk indicators.
- Tasks summary: Counts by status; no inline edit.
- Bug summary: Severity distribution.
- Recent updates: Read-only activity.

### Unique Pages
- Reports Gallery: Curated dashboards; export as CSV/PDF.
- Read-only Project Pages: Overview, tasks list (no mutation), bugs list.

---

## Visibility Rules (by capability)

- Navbar
  - Create workspace visible if system-level permission (Owner/Admin/Manager per policy).
  - Project Pills always visible if view on project/workspace.
  - Quick actions (e.g., Plan Sprint, + New) require create or higher.

- Sidebar
  - Team requires manage_members.
  - Settings requires manage_settings.
  - Billing only Owner.

- Dashboard widgets
  - Mutation affordances require corresponding capability.

---

## Mobile & Responsive Notes

- Navbar: Workspace switcher becomes sheet; project pills in horizontal scroll.
- Sidebar: Collapsible; key actions surfaced in a header menu.
- Dashboards: Widgets stack vertically; KPIs first, then lists.

---

## Empty/Loading/Error States

- Owner: Prompts to create workspace/project; invite members; connect billing.
- Manager: Prompt to plan first sprint; import backlog.
- Member: Prompt to accept tasks; quick tour for keyboard shortcuts.
- Viewer: Prompt to request access when needed.


