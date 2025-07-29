# Supabase Setup Guide for SprintIQ

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `sprintiq`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 4: Run the Database Schema

1. Go to your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL in the Supabase SQL Editor
4. This will create all tables, policies, and functions

## Step 5: Verify Setup

1. Check that all tables were created in the Table Editor
2. Verify RLS policies are enabled
3. Test the connection by running the development server

## Database Schema Overview

The schema includes:

### Core Tables
- **profiles**: Extended user profiles
- **workspaces**: Multi-tenant workspace management
- **projects**: Project management within workspaces
- **tasks**: Task management within projects

### Relationship Tables
- **workspace_memberships**: User roles in workspaces
- **project_memberships**: User roles in projects
- **user_contexts**: User session tracking

### Security Features
- Row Level Security (RLS) enabled on all tables
- Automatic profile creation on user signup
- Role-based access control
- Automatic timestamp updates

### Key Features
- Multi-tenant architecture
- Role-based permissions
- JSON fields for flexible data storage
- Automatic triggers for data integrity

## Next Steps

After completing this setup, you can proceed to:
1. Implement authentication flows
2. Create workspace management features
3. Build project and task management
4. Add AI-powered features

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all policies are created correctly
2. **Type Errors**: Ensure TypeScript types match your schema
3. **Connection Issues**: Verify environment variables are correct

### Useful Commands

```bash
# Check Supabase connection
npm run dev

# View database in Supabase Studio
# Go to your project dashboard → Table Editor
``` 