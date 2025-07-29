# TaskFlow - Complete Architecture & Flow Guide

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Authentication Flow](#authentication-flow)
5. [Application Flow](#application-flow)
6. [Database Architecture](#database-architecture)
7. [AI Features Implementation](#ai-features-implementation)
8. [MCP Integration](#mcp-integration)
9. [API Architecture](#api-architecture)
10. [Frontend Components](#frontend-components)
11. [Feature Implementation](#feature-implementation)

---

## 1. Application Overview

TaskFlow is a comprehensive project management application built with Next.js 14, featuring AI-powered task management, team collaboration, and intelligent project analytics. The application uses a modern tech stack with real-time capabilities and advanced AI integration.

### Key Features
- **Authentication & User Management** (Clerk)
- **Multi-workspace Organization**
- **Project & Task Management**
- **Sprint Planning & Tracking**
- **Bug Reporting & Resolution**
- **AI Chat Assistant** (OpenAI + MCP)
- **Document Management** (S3 + Supabase)
- **Team Collaboration**
- **Analytics & Reporting**

---

## 2. Technology Stack

### Backend Technologies
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Clerk
- **File Storage**: AWS S3 + Supabase Storage
- **API**: REST APIs (Next.js API Routes)

### Frontend Technologies
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Server Components + Client State
- **Forms**: React Hook Form + Zod validation

### AI & Integration
- **AI Provider**: OpenAI (GPT-4)
- **Protocol**: MCP (Model Context Protocol)
- **Real-time**: WebSocket connections
- **Email**: Email service integration

### Development Tools
- **Package Manager**: npm
- **Type Safety**: TypeScript
- **Code Quality**: ESLint
- **Build Tool**: Next.js built-in bundling

---

## 3. Project Structure

```
taskflow/
├── prisma/
│   └── schema.prisma                 # Database schema definition
├── public/
│   └── uploads/                      # Static file uploads
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Dashboard layout group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Main dashboard page
│   │   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   │   ├── projects/             # Project management pages
│   │   │   ├── tasks/                # Task management pages
│   │   │   ├── team/                 # Team management pages
│   │   │   └── workspaces/           # Workspace management pages
│   │   ├── api/                      # API routes
│   │   │   ├── ai/                   # AI-related endpoints
│   │   │   │   ├── chat/             # AI chat functionality
│   │   │   │   ├── execute-action/   # AI action execution
│   │   │   │   ├── parse-task/       # AI task parsing
│   │   │   │   └── task/             # AI task operations
│   │   │   ├── attachments/          # File attachment handling
│   │   │   ├── documents/            # Document management
│   │   │   ├── projects/             # Project CRUD operations
│   │   │   ├── tasks/                # Task CRUD operations
│   │   │   ├── workspaces/           # Workspace operations
│   │   │   └── webhook/              # External webhooks
│   │   ├── projects/                 # Project detail pages
│   │   │   └── [projectId]/          # Dynamic project routes
│   │   │       ├── bugs/             # Bug management
│   │   │       ├── documents/        # Project documents
│   │   │       ├── roadmaps/         # Project roadmaps
│   │   │       ├── sprints/          # Sprint management
│   │   │       └── tasks/            # Project tasks
│   │   ├── sign-in/                  # Authentication pages
│   │   ├── sign-up/
│   │   └── layout.tsx                # Root layout
│   ├── components/                   # Reusable UI components
│   │   ├── ai/                       # AI-related components
│   │   │   ├── AIChatButton.tsx      # Chat trigger button
│   │   │   ├── AIChatWindow.tsx      # Chat interface
│   │   │   └── TaskCreationInput.tsx # AI task creation
│   │   ├── bugs/                     # Bug management components
│   │   ├── documents/                # Document components
│   │   ├── features/                 # Feature management
│   │   ├── projects/                 # Project components
│   │   ├── sprints/                  # Sprint components
│   │   ├── tasks/                    # Task components
│   │   ├── ui/                       # Base UI components (shadcn)
│   │   └── workspaces/               # Workspace components
│   ├── lib/                          # Utility libraries
│   │   ├── ai-task-actions.ts        # AI task processing
│   │   ├── auth-utils.ts             # Authentication utilities
│   │   ├── db.ts                     # Database connection
│   │   ├── mcp-chat-handler.ts       # MCP chat processing
│   │   ├── mcp-client.ts             # MCP client implementation
│   │   ├── prisma.ts                 # Prisma client setup
│   │   ├── s3.ts                     # S3 file handling
│   │   ├── supabase.ts               # Supabase integration
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── utils.ts                  # General utilities
│   ├── types/                        # Type definitions
│   │   ├── index.ts                  # Global types
│   │   ├── task.ts                   # Task-related types
│   │   └── workspace.ts              # Workspace types
│   └── mcp-server.ts                 # MCP server implementation
├── components.json                   # shadcn/ui configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies & scripts
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

---

## 4. Authentication Flow

### Implementation: Clerk Integration
- **Location**: `src/middleware.ts`, `src/lib/auth-utils.ts`
- **Provider**: Clerk (https://clerk.dev)

#### Flow Sequence:
1. **User Access** → Homepage (`src/app/page.tsx`)
2. **Authentication Check** → Middleware (`src/middleware.ts`)
3. **Sign-in/Sign-up** → Clerk pages (`src/app/sign-in/`, `src/app/sign-up/`)
4. **User Creation** → Webhook handler (`src/app/api/webhook/clerk/route.ts`)
5. **Database Sync** → User record creation in PostgreSQL
6. **Dashboard Redirect** → Protected routes access

#### Key Files:
```typescript
// src/middleware.ts
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook"]
});

// src/lib/auth-utils.ts
export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  return await getDbUserId(userId);
}
```

---

## 5. Application Flow

### 5.1 Home Page → Dashboard
```
Homepage (/) 
  ↓ [User clicks "Get Started"]
Sign-in (/sign-in)
  ↓ [Authentication successful]
Onboarding (/onboarding)
  ↓ [Workspace creation]
Dashboard (/dashboard)
```

### 5.2 Dashboard Navigation Structure
```
Dashboard Layout (/dashboard)
├── Overview Dashboard (/dashboard)
├── Projects (/projects)
│   ├── Project List (/projects)
│   └── Project Detail (/projects/[projectId])
│       ├── Tasks (/projects/[projectId]/tasks)
│       ├── Sprints (/projects/[projectId]/sprints)
│       ├── Bugs (/projects/[projectId]/bugs)
│       ├── Documents (/projects/[projectId]/documents)
│       └── Roadmaps (/projects/[projectId]/roadmaps)
├── Tasks (/tasks)
├── Team (/team)
└── Workspaces (/workspaces)
    ├── Workspace List (/workspaces)
    └── Workspace Detail (/workspaces/[workspaceId])
```

### 5.3 User Journey Examples

#### Creating a New Project:
1. **Navigate** → `/projects`
2. **Click** → "Create Project" button
3. **Modal** → `CreateProjectModal.tsx` opens
4. **Form Submit** → API call to `/api/projects`
5. **Database** → Prisma creates project record
6. **Redirect** → `/projects/[newProjectId]`

#### AI Task Creation:
1. **Click** → AI Chat button (`AIChatButton.tsx`)
2. **Chat Window** → `AIChatWindow.tsx` opens
3. **User Input** → "Create task for user authentication"
4. **AI Processing** → `mcp-chat-handler.ts` processes request
5. **MCP Server** → `mcp-server.ts` handles task creation
6. **Database** → Task created via Prisma
7. **Response** → AI confirms task creation

---

## 6. Database Architecture

### 6.1 Prisma Schema Overview
**Location**: `prisma/schema.prisma`

#### Core Entities:
```prisma
model User {
  id                String   @id @default(cuid())
  clerkId          String   @unique
  email            String   @unique
  firstName        String?
  lastName         String?
  // Relationships
  createdTasks     Task[]   @relation("TaskCreator")
  assignedTasks    Task[]   @relation("TaskAssignee")
  workspaces       WorkspaceMember[]
  projects         Project[] @relation("ProjectOwner")
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdBy   String
  projects    Project[]
  members     WorkspaceMember[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  workspaceId String
  ownerId     String
  // Relationships
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  owner       User      @relation("ProjectOwner", fields: [ownerId], references: [id])
  tasks       Task[]
  sprints     Sprint[]
  bugs        Bug[]
}

model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      TaskStatus  @default(TODO)
  priority    Priority    @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  creatorId   String
  // Relationships
  project     Project     @relation(fields: [projectId], references: [id])
  assignee    User?       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creator     User        @relation("TaskCreator", fields: [creatorId], references: [id])
  comments    Comment[]
}
```

### 6.2 Database Connection
**Location**: `src/lib/db.ts`, `src/lib/prisma.ts`

```typescript
// Database connection with Prisma
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

## 7. AI Features Implementation

### 7.1 AI Chat System Architecture
```
User Input → AIChatWindow.tsx → /api/ai/chat → mcp-chat-handler.ts → MCP Server → Database
```

#### Key Components:

**1. Frontend Chat Interface**
- **Location**: `src/components/ai/AIChatWindow.tsx`
- **Features**: Real-time chat, message history, typing indicators
- **State Management**: React state for messages and UI

**2. Chat Handler (Brain)**
- **Location**: `src/lib/mcp-chat-handler.ts`
- **Features**: Intent detection, conversation state, AI processing
- **OpenAI Integration**: GPT-4 for natural language understanding

**3. MCP Server (Actions)**
- **Location**: `src/mcp-server.ts`
- **Features**: 50+ tools for database operations, analytics, search
- **Protocol**: Model Context Protocol for structured AI interactions

### 7.2 AI Feature Categories

#### **A. Task Management AI**
```typescript
// Examples of AI capabilities:
"Create a high priority task for user authentication"
"Assign the login bug to John"
"Show me overdue tasks"
"Update task status to completed"
```

#### **B. Project Analytics AI**
```typescript
// Analytics queries:
"Which projects are behind schedule?"
"Show team performance this month"
"Get project health status"
"Generate weekly summary report"
```

#### **C. Search & Discovery AI**
```typescript
// Intelligent search:
"Find tasks related to authentication"
"Search for bugs in mobile app project"
"Show me tasks assigned to Sarah"
```

### 7.3 MCP Tools Implementation

**Core MCP Tools** (in `src/mcp-server.ts`):
- `createTask` - Create new tasks
- `searchTasks` - Intelligent task search
- `reassignTask` - Task reassignment
- `getProjectHealth` - Project analytics
- `getTeamPerformance` - Team metrics
- `getOverdueTasks` - Deadline tracking
- **50+ additional tools**

---

## 8. MCP Integration

### 8.1 What is MCP?
Model Context Protocol (MCP) is a protocol that enables AI models to securely interact with external systems and data sources.

### 8.2 Implementation Architecture
```
OpenAI GPT-4 ↔ MCP Client ↔ MCP Server ↔ Database/APIs
```

#### **MCP Client** (`src/lib/mcp-client.ts`):
```typescript
export class TaskFlowMCPClient {
  async callTool(name: string, arguments_: any) {
    const client = await this.connect();
    return await client.callTool({ name, arguments: arguments_ });
  }
}
```

#### **MCP Server** (`src/mcp-server.ts`):
```typescript
// Example tool registration:
server.registerTool("createTask", {
  title: "Create Task",
  description: "Create a new task in a project",
  inputSchema: {
    title: z.string(),
    projectId: z.string(),
    // ... other fields
  }
}, async ({ title, projectId, ...data }) => {
  const task = await db.task.create({ data: { title, projectId, ...data } });
  return { content: [{ type: "text", text: `Task "${title}" created` }] };
});
```

### 8.3 AI Chat Processing Flow
1. **User Input**: "Create a task for user authentication"
2. **Intent Detection**: `intelligentToolSelection()` identifies task creation
3. **Parameter Extraction**: AI extracts task details
4. **MCP Tool Call**: `createTask` tool is invoked
5. **Database Operation**: Prisma creates task record
6. **Response**: AI confirms task creation

---

## 9. API Architecture

### 9.1 API Route Structure
All APIs are located in `src/app/api/` following Next.js App Router conventions.

#### **Core API Categories**:

**Project Management**:
- `GET/POST /api/projects` - List/create projects
- `GET/PUT/DELETE /api/projects/[projectId]` - Project CRUD
- `GET /api/projects/[projectId]/tasks` - Project tasks
- `GET /api/projects/[projectId]/members` - Project members

**Task Management**:
- `GET/POST /api/tasks` - List/create tasks
- `GET/PUT/DELETE /api/tasks/[taskId]` - Task CRUD
- `POST /api/tasks/assign-sprint` - Sprint assignment

**AI Endpoints**:
- `POST /api/ai/chat` - AI chat processing
- `POST /api/ai/execute-action` - AI action execution
- `POST /api/ai/parse-task` - AI task parsing

**File Management**:
- `POST /api/documents/upload` - File upload
- `GET /api/documents/[documentId]` - File download
- `GET /api/attachments/[attachmentId]/download` - Attachment download

### 9.2 API Implementation Example
```typescript
// src/app/api/projects/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  const projects = await db.project.findMany({
    where: { ownerId: user.id },
    include: { workspace: true, _count: { select: { tasks: true } } }
  });
  
  return Response.json(projects);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const data = await request.json();
  
  const project = await db.project.create({
    data: { ...data, ownerId: user.id }
  });
  
  return Response.json(project);
}
```

---

## 10. Frontend Components

### 10.1 Component Architecture
TaskFlow uses a hierarchical component structure with shared UI components.

#### **Component Categories**:

**Base UI Components** (`src/components/ui/`):
- `Button`, `Input`, `Card`, `Dialog`, `Table` - shadcn/ui components
- Consistent design system across the app

**Feature Components**:
- **Projects**: `CreateProjectModal`, `ProjectsList`, `ProjectDetail`
- **Tasks**: `TaskCard`, `TaskForm`, `KanbanBoard`, `TasksList`
- **Sprints**: `SprintCard`, `SprintsList`, `SprintTasksManager`
- **AI**: `AIChatButton`, `AIChatWindow`, `TaskCreationInput`

**Layout Components**:
- `AuthedLayout` - Authenticated user wrapper
- `DashboardNav` - Main navigation
- `Navbar` - Public site navigation

### 10.2 Key Component Implementation

#### **AI Chat Window** (`src/components/ai/AIChatWindow.tsx`):
```typescript
export function AIChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input, history: messages })
      });
      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: input },
        { role: 'assistant', content: data.response }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <div className="chat-messages">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      </div>
      <ChatInput onSend={sendMessage} loading={isLoading} />
    </Dialog>
  );
}
```

#### **Kanban Board** (`src/components/tasks/KanbanBoard.tsx`):
```typescript
export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
    { id: 'done', title: 'Done', status: 'done' }
  ];

  const handleDragEnd = async (result: DropResult) => {
    // Update task status via API
    await updateTaskStatus(result.draggableId, result.destination?.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-6">
        {columns.map(column => (
          <KanbanColumn 
            key={column.id} 
            column={column} 
            tasks={tasks.filter(t => t.status === column.status)} 
          />
        ))}
      </div>
    </DragDropContext>
  );
}
```

---

## 11. Feature Implementation

### 11.1 Core Features

#### **A. Workspace Management**
- **Location**: `src/app/workspaces/`, `src/components/workspaces/`
- **Features**: Multi-tenant workspace creation, member management, settings
- **Flow**: Create workspace → Invite members → Configure settings

#### **B. Project Management**
- **Location**: `src/app/projects/`, `src/components/projects/`
- **Features**: Project creation, roadmaps, milestones, team assignment
- **Flow**: Create project → Set up roadmap → Assign team → Track progress

#### **C. Task Management**
- **Location**: `src/app/tasks/`, `src/components/tasks/`
- **Features**: Task CRUD, assignment, prioritization, comments, attachments
- **Views**: List view, Kanban board, Calendar view

#### **D. Sprint Management**
- **Location**: `src/app/projects/[projectId]/sprints/`
- **Features**: Sprint planning, velocity tracking, burndown charts
- **Flow**: Create sprint → Assign tasks → Track progress → Retrospective

#### **E. Bug Tracking**
- **Location**: `src/app/projects/[projectId]/bugs/`
- **Features**: Bug reporting, severity classification, resolution tracking
- **Workflow**: Report bug → Assign → Fix → Verify → Close

#### **F. Document Management**
- **Location**: `src/app/projects/[projectId]/documents/`
- **Storage**: AWS S3 + Supabase
- **Features**: File upload, version control, sharing, search

### 11.2 Advanced Features

#### **A. AI-Powered Analytics**
- **Team Performance Metrics**: Task completion rates, velocity trends
- **Project Health Monitoring**: Behind schedule detection, risk assessment
- **Predictive Analytics**: Delivery date prediction, resource optimization

#### **B. Real-time Collaboration**
- **Live Updates**: Task status changes, comments, assignments
- **Notifications**: In-app notifications, email alerts
- **Activity Feeds**: Real-time activity logs

#### **C. Reporting & Insights**
- **Weekly Summaries**: Automated progress reports
- **KPI Dashboards**: Key performance indicators
- **Custom Reports**: Flexible reporting system

---

## 12. Development & Deployment

### 12.1 Development Setup
```bash
# Clone repository
git clone <repository-url>
cd taskflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 12.2 Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# AI
OPENAI_API_KEY="sk-..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

### 12.3 Key Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

---

## 13. Security & Best Practices

### 13.1 Authentication Security
- **JWT Tokens**: Clerk handles secure token management
- **Route Protection**: Middleware ensures authenticated access
- **Role-based Access**: Workspace and project-level permissions

### 13.2 Data Security
- **Input Validation**: Zod schemas for API validation
- **SQL Injection Prevention**: Prisma ORM protects against SQL injection
- **File Upload Security**: Validated file types and sizes

### 13.3 Performance Optimizations
- **Server Components**: Reduced client-side JavaScript
- **Database Queries**: Optimized Prisma queries with includes
- **Caching**: Next.js automatic caching for static content
- **Image Optimization**: Next.js Image component

---

## 14. Future Enhancements

### 14.1 Planned Features
- **Mobile App**: React Native implementation
- **Advanced Analytics**: Machine learning insights
- **Integrations**: GitHub, Slack, Jira integrations
- **Automation**: Workflow automation and triggers

### 14.2 Scalability Considerations
- **Database Sharding**: Multi-tenant data separation
- **Microservices**: Breaking down monolithic structure
- **CDN Integration**: Global content delivery
- **Monitoring**: Application performance monitoring

---

This comprehensive guide covers the complete architecture and implementation of TaskFlow. Each section provides detailed insights into how the application is built, organized, and functions as a cohesive project management platform with advanced AI capabilities. 