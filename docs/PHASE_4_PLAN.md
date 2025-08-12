# Sprint IQ Development Plan & To-Do List

This document outlines the features, fixes, and new implementations required for the Sprint IQ application. It is organized by scope: Project-Level, Workspace-Level, and Core Infrastructure.

---

## 1. Project-Level Features & Fixes

This section covers features and fixes within the scope of a single project.

### 1.1. Task Page Enhancements

#### 1.1.1. Task History
* **Issue:** `GET /api/tasks/.../history` returns a 500 error.
* **To-Do List:**
    -   [x] **Schema:** Create a `TaskHistory` model in `schema.prisma` to log changes.
        ```prisma
        model TaskHistory {
          id          String   @id @default(uuid())
          taskId      String
          task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
          userId      String   // ID of the user who made the change
          user        User     @relation(fields: [userId], references: [id])
          field       String   // e.g., "status", "assignee", "description"
          oldValue    String?
          newValue    String?
          changedAt   DateTime @default(now())
        }
        ```
    -   [x] **Backend:** Implement the logic in `src/app/api/tasks/[taskId]/history/route.ts` to query the `TaskHistory` table for the given `taskId`.
    -   [x] **Backend:** Create backend logic to automatically log an entry in `TaskHistory` whenever a task is updated.
    -   [x] **Frontend:** Ensure the "History" tab on the task page correctly fetches and displays this data.

#### 1.1.2. Sub-tasks
* **Issue:** `POST /api/tasks/.../subtasks` returns a 500 error.
* **To-Do List:**
    -   [x] **Schema:** Create a `SubTask` model in `schema.prisma`.
        ```prisma
        model SubTask {
          id          String   @id @default(uuid())
          title       String
          isCompleted Boolean  @default(false)
          parentTaskId String
          parentTask  Task     @relation(fields: [parentTaskId], references: [id], onDelete: Cascade)
          assigneeId  String?
          assignee    User?    @relation(fields: [assigneeId], references: [id])
          createdAt   DateTime @default(now())
          updatedAt   DateTime @updatedAt
        }
        ```
    -   [x] **Backend:** Implement the `POST` method in `src/app/api/tasks/[taskId]/subtasks/route.ts` to create a new sub-task linked to the parent task.
    -   [x] **Backend:** Implement `PATCH` and `DELETE` endpoints for updating and deleting sub-tasks.
    -   [x] **Frontend:** Ensure the "Sub-tasks" component on the task page can create, display, and update the status of sub-tasks.

### 1.2. Sprints & Timeline
* **To-Do List:**
    -   [x] **UI Fix:** In the Member's view of the Sprints page, add a static title `<h1>Sprint Management</h1>`.
    -   [ ] **Bug Fix:** The "Create Sprint" button is not working.
        -   [x] **Backend:** Build the `POST /api/projects/[projectId]/sprints` API endpoint. It should accept a `name`, `goal`, `startDate`, and `endDate` and create a new sprint record.
        -   [x] **Frontend:** Wire the "Create Sprint" button and form to this new API endpoint.
    -   [ ] **Feature:** Enable dragging backlog tasks into a "Planned Sprint" column.
        -   [ ] **Frontend:** Implement the drag-and-drop logic (`dnd-kit`).
        -   [x] **Backend:** On drop, call an API (`PATCH /api/tasks/[taskId]`) to update the task's `sprintId`.
    -   [x] **Feature:** Implement Milestone creation on the Timeline.
        -   [x] **Schema:** Create a `Milestone` model in `schema.prisma` linked to a project.
        -   [x] **Backend:** Create full CRUD API endpoints for milestones (`/api/projects/[projectId]/milestones`).
        -   [x] **Frontend:** Add a "Create Milestone" button to the Timeline page and render milestones on the Gantt chart.

### 1.3. Reports & Analytics
* **Issue:** The report calculations are placeholders. Real logic is needed.
* **To-Do List:**
    -   [x] **Backend:** Create a new API endpoint `GET /api/projects/[projectId]/reports` that calculates and returns all the following metrics. The endpoint should accept a date range for filtering.
    -   [x] **Metric Logic:**
        * **Average Velocity:** Calculate the sum of story points for all completed tasks in the last 3 sprints and divide by 3.
        * **Average Cycle Time:** For all tasks completed in the date range, calculate the average time difference between `status = 'In Progress'` and `status = 'Done'`.
        * **Total Points Delivered:** Sum of story points for all tasks completed in the date range.
        * **Delivery Efficiency:** `(Total points completed / Total points planned in the sprint) * 100`.
    -   [x] **Cumulative Flow Diagram:**
        * **Backend:** The API needs to return a daily snapshot of how many tasks were in each status category (To Do, In Progress, Done) for the given date range.
        * **Frontend:** Use this data to render the stacked area chart.
    -   [x] **Workload Distribution:**
        * **Backend:** The API should return a list of team members and the count (or sum of story points) of tasks they completed in the date range.
        * **Frontend:** Use this data to render the pie or bar chart.

### 1.4. Project Settings
* **Issue:** The settings page has UI but no backend logic.
* **To-Do List:**
    -   [x] **Schema:** Enhance the `Project` model in `schema.prisma`.
        ```prisma
        model Project {
          // ... existing fields
          visibility  String   @default("private") // private, public
          category    String?
          currency    String   @default("USD")
          startDate   DateTime?
          targetEndDate DateTime?
          budget      Float?
        }
        ```
    -   [x] **Schema:** Create a `TaskStatus` model for customizable workflows.
        ```prisma
        model TaskStatus {
            id          String   @id @default(uuid())
            name        String   // "To Do", "In Progress"
            color       String   // "#FF5733"
            order       Int
            projectId   String
            project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
        }
        ```
    -   [x] **Backend:** Implement a `PATCH /api/projects/[projectId]` endpoint that allows updating these new project settings fields.
    -   [x] **Backend:** Create full CRUD API endpoints for `TaskStatus` (`/api/projects/[projectId]/task-statuses`).
    -   [x] **Frontend:** Wire up the input fields on the Settings page to their respective API endpoints.

---

## 2. Workspace-Level Features & Fixes

This section covers features at the main workspace dashboard level.

### 2.1. Core Features
* **To-Do List:**
    -   [x] **UI Refinement:** Refine the "Team Members" section on the workspace dashboard to be more detailed, perhaps showing user roles and a new "Status" field.
    -   [x] **Active Status:**
        -   [x] **Schema:** Add an `lastActive` `DateTime` field to the `User` model.
        -   [x] **Backend:** Implement middleware or a backend process that updates this timestamp on every authenticated API request from the user.
        -   [x] **Frontend:** Display a green dot and "Active today" if `lastActive` is within the last 24 hours. Otherwise, show the last active date.
    -   [x] **UI Fix:** Remove the "Sprint Planner" from the main workspace sidebar. It should only exist inside a project.

### 2.2. Workspace Reports
* **Issue:** The entire section needs backend logic.
* **To-Do List:**
    -   [x] **Backend:** Create a new API endpoint `GET /api/workspaces/[workspaceId]/reports` that aggregates data from all projects within the workspace to calculate the following:
        * **Active Projects:** Count of projects not archived.
        * **Team Velocity:** Average velocity across all teams/projects.
        * **Total Story Points Delivered:** Sum of story points from all completed tasks in the workspace for a given period.
        * **On-Time Delivery %:** Percentage of tasks completed on or before their due date across the workspace.
        * **Cross-Project Burndown:** A burndown chart aggregating all active sprints in the workspace.
        * **Resource Allocation Heatmap:** A matrix of users and their assigned task counts/story points across all projects to identify workload.
        * **Workspace Cycle Time:** Average cycle time across all projects.
        * **Project Health Status:** A summary of how many projects are "On Track," "At Risk," etc.
    -   [x] **Frontend:** Build individual widgets for each of these metrics and populate them with data from the new API endpoint.

### 2.3. Usage & Analytics
* **Issue:** This page is static and needs full backend implementation.
* **To-Do List:**
    -   [ ] **Backend:** Create an API endpoint `GET /api/workspaces/[workspaceId]/usage` that calculates and returns the following data:
        * **Current Plan:** Fetched from the `Subscription` model.
        * **Team Members:** Count of active users in the workspace.
        * **File Storage:** Sum of the size of all `Attachment` records across all projects.
        * **Active Projects:** Count of projects not archived.
        * **AI Credits:** Requires a new `usage` table to track AI credit consumption.
        * **Storage Breakdown:** Requires analyzing file types of attachments.
        * **Resource Usage by Project:** A query that groups storage usage and member count by project.
    -   [ ] **Frontend:** Connect all the UI widgets on the Usage & Analytics page to this new API endpoint.

### 2.4. Audit Logs
* **Issue:** Needs complete backend implementation.
* **To-Do List:**
    -   [x] **Schema:** Create an `AuditLog` model in `schema.prisma`.
        ```prisma
        model AuditLog {
          id          String   @id @default(uuid())
          workspaceId String
          workspace   Workspace @relation(fields: [workspaceId], references: [id])
          actorId     String
          actor       User     @relation(fields: [actorId], references: [id])
          action      String   // e.g., "project.delete", "user.role.change"
          severity    String   // "low", "medium", "high"
          ipAddress   String?
          details     Json?    // Store extra context, e.g., { "projectName": "..." }
          createdAt   DateTime @default(now())
        }
        ```
    -   [x] **Backend:** Create a logging service that can be called from anywhere in the backend to create an `AuditLog` entry.
    -   [x] **Backend:** Integrate this logging service into all critical actions (deleting a project, changing a role, updating security settings, etc.).
    -   [x] **Backend:** Create the API endpoint `GET /api/workspaces/[workspaceId]/audit-logs` with filtering capabilities for action, severity, and date range.
    -   [ ] **Frontend:** Wire the Audit Logs page to this API endpoint.

---

## 3. Core Infrastructure & Integrations

### 3.1. User Profile & Notifications
* **To-Do List:**
    -   [ ] **Feature:** Create a dedicated User Profile page where users can update their name, avatar, and password.
    -   [x] **Feature:** Implement a Notification system.
        -   [x] **Schema:** Create `Notification` and `UserNotificationPreference` models.
        -   [x] **Backend:** Create a notification service to generate notifications (e.g., when a user is mentioned, assigned a task).
        -   [x] **Backend:** Create APIs for fetching notifications and updating preferences.
        -   [x] **Frontend:** Build a notification center UI (e.g., a dropdown from the main navbar) and a Notification Preferences page in the user's settings.

### 3.2. Billing & Subscriptions
* **Issue:** This is a major epic that needs to be planned and implemented.
* **To-Do List:**
    -   [ ] **Planning:** Define the different plan tiers (e.g., Free, Pro, Enterprise) and the features/limits associated with each.
    -   [ ] **Schema:** Design the database models for `Plan`, `Subscription`, `Invoice`.
        ```prisma
        model Plan {
          id              String    @id
          name            String
          price           Float
          currency        String
          billingCycle    String    // "monthly", "yearly"
          // ... limits like projectLimit, userLimit, etc.
        }

        model Subscription {
          id              String    @id @default(uuid())
          workspaceId     String    @unique
          workspace       Workspace @relation(fields: [workspaceId], references: [id])
          planId          String
          plan            Plan      @relation(fields: [planId], references: [id])
          stripeSubId     String    @unique // Stripe's subscription ID
          status          String    // "active", "canceled", "past_due"
          currentPeriodEnd DateTime
        }
        ```
    -   [ ] **Integration:** Choose and integrate a payment provider like **Stripe**.
    -   [ ] **Backend:** Build webhooks to handle events from Stripe (e.g., `invoice.payment_succeeded`, `customer.subscription.deleted`).
    -   [ ] **Backend:** Build API endpoints for upgrading/downgrading plans and fetching billing history.
    -   [ ] **Frontend:** Build the complete "Billing" page UI.

### 3.3. File Management & Integrations
* **To-Do List:**
    -   [ ] **Feature:** Implement a centralized Project File Management page. This would be a UI that lists all `Attachment` records for a project in one place.
    -   [ ] **Feature:** Implement the backend logic for connecting to third-party integrations (Slack, GitHub, etc.).
        -   [ ] **Schema:** Create an `Integration` model to store connection details and tokens.
        -   [ ] **Backend:** Implement OAuth 2.0 flows for each service you want to integrate.
        -   [ ] **Frontend:** Build the "Configure" modals for each connected integration.