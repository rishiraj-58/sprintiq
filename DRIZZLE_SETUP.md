# Drizzle ORM Setup Guide for SprintIQ

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `sprintiq`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Database URL

1. Go to Settings → Database in your Supabase dashboard
2. Copy the connection string from "Connection string" section
3. Replace `[YOUR-PASSWORD]` with your database password
4. Replace `[YOUR-PROJECT-REF]` with your project reference

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DATABASE_URL=postgresql://postgres:your_password@db.your_project_ref.supabase.co:5432/postgres
   ```

## Step 4: Generate and Push Database Schema

1. Generate the migration files:
   ```bash
   npm run db:generate
   ```

2. Push the schema to your database:
   ```bash
   npm run db:push
   ```

3. (Optional) View your database in Drizzle Studio:
   ```bash
   npm run db:studio
   ```

## Step 5: Verify Setup

1. Check that all tables were created in Supabase Table Editor
2. Verify the schema matches your requirements
3. Test the connection by running the development server

## Database Schema Overview

The Drizzle schema includes:

### Core Tables
- **profiles**: Extended user profiles with system roles
- **workspaces**: Multi-tenant workspace management
- **projects**: Project management within workspaces
- **tasks**: Task management within projects

### Relationship Tables
- **workspace_memberships**: User roles and permissions in workspaces
- **project_memberships**: User roles and permissions in projects
- **user_contexts**: User session and context tracking

### Key Features
- **Type Safety**: Full TypeScript support with Drizzle
- **Relations**: Proper foreign key relationships
- **Enums**: System roles and role capabilities
- **JSON Fields**: Flexible data storage for settings and metadata
- **Timestamps**: Automatic created_at and updated_at fields

## Using Drizzle in Your Code

### Basic Queries

```typescript
import { db } from '@/db'
import { profiles, workspaces } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Get user profile
const profile = await db.query.profiles.findFirst({
  where: eq(profiles.id, userId)
})

// Get user's workspaces
const userWorkspaces = await db.query.workspaces.findMany({
  where: eq(workspaceMemberships.userId, userId),
  with: {
    workspaceMemberships: true
  }
})
```

### Insert Operations

```typescript
import { db } from '@/db'
import { workspaces } from '@/db/schema'

const newWorkspace = await db.insert(workspaces).values({
  name: 'My Workspace',
  slug: 'my-workspace',
  createdBy: userId
}).returning()
```

### Update Operations

```typescript
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

await db.update(profiles)
  .set({ lastActiveAt: new Date() })
  .where(eq(profiles.id, userId))
```

## Available Scripts

- `npm run db:generate` - Generate migration files
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

## Next Steps

After completing this setup, you can proceed to:
1. Implement authentication flows
2. Create workspace management features
3. Build project and task management
4. Add AI-powered features

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify DATABASE_URL is correct
2. **Schema Errors**: Check that all tables are created properly
3. **Type Errors**: Ensure TypeScript types match your schema

### Useful Commands

```bash
# Check database connection
npm run db:studio

# Generate new migration
npm run db:generate

# Push schema changes
npm run db:push
``` 