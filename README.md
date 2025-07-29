# TaskFlow - Project Management Tool

TaskFlow is a comprehensive project management tool aimed at solving the pain points of development teams. It integrates various functionalities such as sprint management, roadmap planning, bug tracking, and team collaboration - all in one centralized platform.

## Tech Stack

- **Frontend**: Next.js
- **Authentication**: Clerk
- **Database**: Supabase with Prisma ORM
- **File Storage**: Amazon S3 Buckets
- **Payments**: Stripe
- **AI Features**: GitHub AI Model via Azure Inference API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- Clerk account
- AWS account (for S3)
- Stripe account (for payments)
- GitHub token for AI features

## Setup Instructions

### 1. Clone the Repository

```bash
git clone git@github.com:rishiraj-58/taskflow.git
cd taskflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database - Supabase
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# GitHub AI (for AI features)
GITHUB_TOKEN=your_github_token
```

Replace the placeholder values with your actual credentials.

### 4. Set Up Prisma

Run the following commands to set up the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate:dev

# Deploy migrations (production)
npm run prisma:migrate:deploy
```

### 5. Set Up Clerk Webhooks

1. In your Clerk Dashboard, go to the Webhooks section
2. Create a new webhook pointing to `https://your-domain.com/api/webhook/clerk`
3. Copy the webhook secret and add it to your `.env` file as `CLERK_WEBHOOK_SECRET`
4. Select the following events to listen for:
   - `user.created`
   - `user.updated`
   - `user.deleted`

### 6. Set Up AI Features (Optional)

TaskFlow includes AI-powered features for natural language task management. To set up these features:

```bash
# Run the AI setup script
bash setup-ai.sh
```

This script will:
1. Install the required AI dependencies
2. Set up the necessary environment variables
3. Provide instructions for configuring your GitHub token

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## AI Features

TaskFlow includes an AI assistant that helps users manage tasks using natural language. The AI assistant can:

- Create tasks from natural language descriptions
- Update task properties (assignee, status, priority, etc.)
- Move tasks between sprints
- Generate subtasks for complex work items

### Using the AI Assistant

1. Navigate to your project dashboard
2. Click the chat icon in the bottom-right corner of the screen
3. Type a natural language command like:
   - "Create a bug task for the login page error"
   - "Move all UI tasks to Sprint 3"
   - "Generate 5 subtasks for the user onboarding feature"
4. Review and confirm the AI's interpretation
5. The action will be executed and visible in your project

### AI Setup Requirements

The AI features require:
- A GitHub token with access to the GitHub AI model
- The Azure Inference API client libraries
- The environment variable `GITHUB_TOKEN` set in your `.env.local` file

## Deployment

The application is configured for deployment on Vercel. Connect your GitHub repository to Vercel and set up the required environment variables.

## Development Workflow

1. Create a new branch for each feature or bug fix
2. Make your changes
3. Submit a pull request to the main branch
4. CI/CD will automatically run tests and linting checks

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run linting checks
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run database migrations in development
- `npm run prisma:studio` - Open Prisma Studio to view/edit database
- `npm run prisma:migrate:deploy` - Deploy migrations to production

## License

[MIT](https://choosealicense.com/licenses/mit/)
