# TaskFlow - Complete Business Logic & Application Guide

## Table of Contents
1. [Application Hierarchy & Structure](#application-hierarchy--structure)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Team Management Logic](#team-management-logic)
4. [Feature Flow & Relationships](#feature-flow--relationships)
5. [User Journey Scenarios](#user-journey-scenarios)
6. [Business Logic Clarifications](#business-logic-clarifications)
7. [Current Implementation Issues](#current-implementation-issues)
8. [Recommended Business Logic](#recommended-business-logic)

---

## Application Hierarchy & Structure

### 🏗️ Organizational Hierarchy

```
User Account (Clerk Authentication)
├── Workspaces (Multiple)
│   ├── Workspace Members (Role-based)
│   ├── Projects (Multiple per workspace)
│   │   ├── Project Members (Subset of workspace members)
│   │   ├── Tasks (Project-specific)
│   │   ├── Sprints (Project-specific)
│   │   ├── Bugs (Project-specific)
│   │   ├── Documents (Project-specific)
│   │   └── Roadmaps (Project-specific)
│   └── Settings & Configuration
```

### 📋 Entity Relationships

**Workspace Level:**
- **Purpose**: Top-level organizational unit (e.g., "Acme Corp", "Marketing Team")
- **Contains**: Projects, workspace-wide team members, settings
- **Access**: Users must be invited to workspaces
- **Visibility**: All workspace members can see all projects in that workspace

**Project Level:**
- **Purpose**: Specific initiatives within a workspace (e.g., "Mobile App v2.0", "Website Redesign")
- **Contains**: Tasks, sprints, bugs, documents, roadmaps
- **Access**: Project members are a subset of workspace members
- **Ownership**: Each project has an owner (creator or assigned)

**Task/Sprint/Bug Level:**
- **Purpose**: Work items within a specific project
- **Scope**: Always belongs to one project
- **Assignment**: Can only be assigned to project members

---

## User Roles & Permissions

### 🎭 Workspace Roles

**Workspace Owner (Creator)**
- Can delete the entire workspace
- Can manage all workspace settings
- Can invite/remove members
- Can assign admin roles
- Has access to all projects in workspace

**Workspace Admin**
- Can invite/remove members (except owner)
- Can modify workspace settings
- Can create/delete projects
- Has access to all projects in workspace
- Cannot delete the workspace

**Workspace Member**
- Can view workspace and available projects
- Can be assigned to specific projects
- Cannot modify workspace settings
- Cannot invite new members to workspace

### 🔐 Project Roles

**Project Owner**
- Creator of the project or assigned owner
- Can delete the project
- Can modify project settings
- Can add/remove project members
- Full access to all project features

**Project Member**
- Added to project by owner/admin
- Can create/edit tasks, bugs, documents
- Can participate in sprints
- Can view all project data
- Cannot modify project settings

**Project Viewer** (Optional role)
- Read-only access to project
- Cannot create or modify anything
- Can view tasks, bugs, documents

---

## Team Management Logic

### 👥 How Team Management Actually Works

**Workspace-Level Team Management:**
1. Users are invited to workspaces via email
2. They become "workspace members" with a specific role
3. Workspace members can see all projects in that workspace
4. Not all workspace members are automatically project members

**Project-Level Team Management:**
1. Project owners can assign workspace members to their projects
2. Only assigned project members can be task assignees
3. Project members inherit project access but not workspace admin rights
4. Project membership is independent of workspace role (a workspace member can be a project owner)

### 🔄 Current Confusion Points

**The "Team" Tab in Dashboard:**
- **Current Issue**: Shows all workspace members globally
- **Should Show**: Context-sensitive team view based on current scope
- **Logic Problem**: No clear distinction between workspace team and project teams

**Task Assignment Logic:**
- **Current Issue**: Tasks can be assigned to any workspace member
- **Should Be**: Tasks only assignable to project members
- **Why**: A workspace member might not be involved in a specific project

---

## Feature Flow & Relationships

### 📊 Dashboard Logic

**Current Dashboard Shows:**
- Global stats across all workspaces
- Recent projects from all workspaces
- Global task counts
- Quick actions

**Issues with Current Logic:**
- No workspace context filtering
- Mixes data from different workspaces
- Unclear what "tasks" refers to (all tasks or specific project tasks)

**Recommended Dashboard Logic:**
```
Dashboard View Options:
├── Global Dashboard (All Workspaces)
│   ├── Workspace summary cards
│   ├── Recent activity across workspaces
│   └── Quick actions (create workspace, join workspace)
├── Workspace Dashboard (Specific Workspace)
│   ├── Projects in this workspace
│   ├── Team members in this workspace
│   ├── Recent activity in workspace
│   └── Workspace-specific quick actions
└── Project Dashboard (Specific Project)
    ├── Project-specific metrics
    ├── Recent tasks, bugs, sprint progress
    ├── Project team members
    └── Project-specific actions
```

### 🎯 Task Management Logic

**Current Implementation Issues:**
1. **Global Tasks Tab**: Shows tasks from all projects across all workspaces
2. **Project Tasks Tab**: Shows only project-specific tasks
3. **Assignment Confusion**: Can assign tasks to any workspace member

**Recommended Task Logic:**
```
Task Organization:
├── My Tasks (User-specific view)
│   ├── Assigned to me (across all projects)
│   ├── Created by me
│   ├── Recently viewed
│   └── Overdue tasks
├── Project Tasks (Project-specific view)
│   ├── All tasks in current project
│   ├── Organized by sprint/status
│   ├── Only assignable to project members
│   └── Project-specific filters
└── Workspace Tasks (Workspace-level view)
    ├── Tasks across all projects in workspace
    ├── Team workload view
    ├── Cross-project dependencies
    └── Workspace-level reporting
```

### 🏃 Sprint Management Logic

**How Sprints Should Work:**
1. Sprints belong to specific projects only
2. Only project tasks can be added to project sprints
3. Sprint participants are project members
4. Sprint metrics are project-specific

**Current Issues:**
- Sprint creation doesn't validate project membership
- Task assignment to sprints lacks proper validation
- No sprint capacity planning based on team size

### 🐛 Bug Tracking Logic

**Current Implementation:**
- Bugs belong to projects
- Can be assigned to any workspace member
- Basic status and priority tracking

**Recommended Bug Logic:**
- Bugs should only be assignable to project members
- Bug severity should affect project health metrics
- Integration with task management (bugs can become tasks)

---

## User Journey Scenarios

### 👤 New User Onboarding

**Scenario 1: Creating First Workspace**
```
1. User signs up via Clerk
2. Lands on empty dashboard
3. Prompted to create first workspace
4. Workspace created → User becomes workspace owner
5. Guided to create first project
6. Project created → User becomes project owner
7. Invited to explore features (tasks, sprints, AI assistant)
```

**Scenario 2: Invited to Existing Workspace**
```
1. User receives workspace invitation email
2. Signs up/signs in via invitation link
3. Automatically added to workspace as member
4. Sees workspace dashboard with available projects
5. Can request access to specific projects
6. Once added to project, can participate in project activities
```

### 🏢 Team Collaboration Scenarios

**Scenario 1: Project Manager Workflow**
```
1. PM creates new project in workspace
2. PM invites relevant workspace members to project
3. PM creates sprints and initial tasks
4. PM assigns tasks to project team members
5. PM monitors progress via project dashboard
6. PM runs sprint retrospectives and planning
```

**Scenario 2: Developer Workflow**
```
1. Developer is added to multiple projects
2. Uses "My Tasks" view to see all assigned work
3. Updates task status and logs time
4. Reports bugs found during development
5. Participates in sprint planning and reviews
6. Uses AI assistant for task management
```

**Scenario 3: Stakeholder/Client Workflow**
```
1. External stakeholder invited as project viewer
2. Can see project progress and deliverables
3. Can view documents and roadmaps
4. Cannot modify tasks or project settings
5. Can provide feedback via comments
```

---

## Business Logic Clarifications

### 🤔 Resolving Current Confusions

**Q: What's the difference between workspace members and project members?**
**A:** 
- Workspace members have access to the workspace and can see all projects
- Project members are a subset who actively work on specific projects
- You must be a workspace member before becoming a project member

**Q: Why are there tasks in both dashboard and projects?**
**A:**
- Dashboard "My Tasks" = All tasks assigned to you across all projects
- Project Tasks = All tasks within a specific project
- These are different views of the same data, filtered differently

**Q: How do permissions work across the hierarchy?**
**A:**
```
Workspace Owner → Can do anything in workspace + all projects
Workspace Admin → Can manage workspace + all projects
Workspace Member + Project Owner → Can manage specific project only
Workspace Member + Project Member → Can work on project tasks
Project Viewer → Read-only access to project
```

**Q: When should someone create a new workspace vs a new project?**
**A:**
- New Workspace: Different organization, team, or major business unit
- New Project: New initiative within the same organization/team

### 📝 Data Ownership Rules

**Workspace Data:**
- Workspace settings (owned by workspace)
- Team member list (owned by workspace)
- Workspace-level permissions

**Project Data:**
- Tasks, sprints, bugs, documents (owned by project)
- Project member assignments (owned by project)
- Project settings and configurations

**User Data:**
- Personal task assignments (owned by user)
- User preferences and settings
- Cross-project activity history

---

## Current Implementation Issues

### 🚨 Critical Logic Flaws

1. **Inconsistent Team Management**
   - Workspace members can be assigned to tasks in projects they're not members of
   - No clear project membership validation
   - Project team management is disconnected from workspace team

2. **Confusing Task Organization**
   - Global tasks tab shows tasks from all workspaces/projects
   - No clear context about which workspace/project tasks belong to
   - Assignment logic doesn't respect project boundaries

3. **Permission System Gaps**
   - No enforcement of project membership for task assignment
   - Workspace roles don't properly cascade to project permissions
   - Missing granular permissions for different actions

4. **Dashboard Context Issues**
   - Dashboard doesn't show current workspace/project context
   - Metrics mix data from different organizational levels
   - No way to filter dashboard by workspace

5. **Sprint Management Problems**
   - Sprints can be created without proper project context
   - Task assignment to sprints doesn't validate project membership
   - No capacity planning or velocity tracking

### 🔧 Missing Business Logic

1. **Workspace Switching**
   - No clear way to switch between workspaces
   - No workspace-specific context in UI
   - Global vs workspace views are mixed

2. **Project Membership Management**
   - No formal process to add/remove project members
   - No distinction between active and inactive project members
   - No project-specific role management

3. **Cross-Project Dependencies**
   - No way to link tasks across projects
   - No cross-project reporting
   - Missing workspace-level overview

4. **Audit and Activity Tracking**
   - Limited activity logging
   - No proper audit trails for compliance
   - Missing change history for important entities

---

## Recommended Business Logic

### 🎯 Simplified and Clear Structure

**1. Workspace-Centric Design**
```
User Experience Flow:
1. User selects/creates workspace (primary context)
2. Within workspace, user sees all projects
3. Within project, user sees all project-specific data
4. Clear breadcrumb navigation shows current context
```

**2. Clear Permission Model**
```
Workspace Level:
- Owner: Full control
- Admin: Everything except delete workspace
- Member: Project assignment + basic workspace access

Project Level:
- Owner: Full project control
- Member: Task/bug creation, sprint participation
- Viewer: Read-only access
```

**3. Logical Task Organization**
```
Dashboard Views:
- "My Work": All tasks assigned to user (cross-project)
- "Workspace Overview": High-level workspace metrics
- "Project Tasks": Project-specific task management
```

**4. Proper Team Management**
```
Team Hierarchy:
1. Invite users to workspace (workspace members)
2. Assign workspace members to projects (project members)
3. Only project members can be assigned project tasks
4. Clear UI showing who has access to what
```

### 🚀 Implementation Priority

**Phase 1: Fix Core Logic**
1. Implement proper workspace context switching
2. Fix task assignment to respect project membership
3. Clarify dashboard views and metrics
4. Add proper project membership management

**Phase 2: Enhanced Permissions**
1. Implement granular project permissions
2. Add project viewer role
3. Enforce permission checks in all APIs
4. Add audit logging

**Phase 3: Advanced Features**
1. Cross-project dependency tracking
2. Advanced workspace analytics
3. Custom permission roles
4. Enterprise compliance features

---

## Conclusion

The current TaskFlow implementation has good individual components but lacks clear business logic connecting them. The main issues are:

1. **Unclear organizational hierarchy** - Users don't understand workspace vs project boundaries
2. **Inconsistent permission enforcement** - Rules aren't consistently applied
3. **Mixed data contexts** - Dashboard and views mix data from different organizational levels
4. **Poor team management logic** - Workspace and project teams are poorly connected

**The fix requires:**
- Simplifying the mental model for users
- Implementing consistent permission enforcement
- Creating clear context switching between workspace/project views
- Establishing proper data ownership rules

Once these foundational issues are addressed, the AI features and advanced functionality will make much more sense to users. 