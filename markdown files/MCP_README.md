# TaskFlow MCP Server

This document describes the Model Context Protocol (MCP) server implementation for TaskFlow.

## Overview

The MCP server provides a standardized interface for AI models to interact with TaskFlow's project management features. It implements the official MCP specification and provides tools and resources for managing tasks, projects, and workspaces.

## Features

### Tools
- **createTask**: Create a new task in a project
- **listProjects**: List all projects in a workspace
- **listTasks**: List tasks with optional filtering

### Resources
- **project://{projectId}**: Get detailed information about a specific project
- **workspace://{workspaceId}**: Get detailed information about a specific workspace

## Installation

The MCP server requires the following dependencies:
- `@modelcontextprotocol/sdk`
- `zod` for schema validation
- `ts-node` for TypeScript execution

These are already included in the project dependencies.

## Usage

### Running the MCP Server

```bash
# Run the MCP server directly
npm run mcp:server

# Or test it with the test script
node test-mcp.js
```

### Using the MCP Client

The MCP client is integrated into the AI chat system. You can use it in your code:

```typescript
import { mcpClient, createTask, listProjects, listTasks } from './lib/mcp-client';

// Create a task
const result = await createTask({
  title: "New Task",
  description: "Task description",
  projectId: "project-id",
  priority: "medium",
  status: "todo"
});

// List projects
const projects = await listProjects();

// List tasks
const tasks = await listTasks({ status: "todo" });
```

### AI Chat Integration

The AI chat system now uses the MCP server to provide more accurate and structured responses. When users ask about tasks, projects, or workspaces, the AI can:

1. Call the appropriate MCP tools
2. Get structured data from the database
3. Provide formatted responses with actual project information

## Model Configuration

The AI chat system has been updated to use `gpt-4o-mini` which is compatible with the GitHub Copilot Models API. Make sure your environment variables are set:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_BASE_URL=your_api_base_url
```

## Architecture

### MCP Server (`src/mcp-server.ts`)
- Implements the official MCP specification
- Provides tools for task and project management
- Uses Prisma for database operations
- Handles authentication and authorization

### MCP Client (`src/lib/mcp-client.ts`)
- Connects to the MCP server via stdio transport
- Provides helper functions for common operations
- Manages server process lifecycle
- Handles connection and disconnection

### Chat Handler (`src/lib/mcp-chat-handler.ts`)
- Integrates MCP client with AI chat
- Analyzes user intent and calls appropriate tools
- Formats responses for the user interface
- Maintains conversation context

## Error Handling

The MCP server includes comprehensive error handling:
- Database connection errors
- Authentication failures
- Invalid input parameters
- Resource not found errors

All errors are properly formatted and returned to the client.

## Security

- All database operations are performed through Prisma ORM
- User authentication is handled by Clerk
- Input validation is performed using Zod schemas
- No sensitive data is exposed through the MCP interface

## Testing

You can test the MCP server using the provided test script:

```bash
node test-mcp.js
```

This will start the server and send a test initialization message to verify it's working correctly.

## Future Enhancements

Planned improvements to the MCP server:
- Add more tools (create project, update task, etc.)
- Implement resource listing
- Add support for real-time updates
- Improve error messages and debugging
- Add support for file attachments and documents

## Troubleshooting

### Common Issues

1. **Server won't start**: Check that ts-node is installed and TypeScript files are properly configured
2. **Database connection errors**: Ensure your database is running and Prisma is properly configured
3. **Authentication errors**: Verify that Clerk authentication is working correctly
4. **Model not found**: Make sure you're using the correct model name for your API provider

### Debug Mode

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=mcp:* npm run mcp:server
```

This will provide detailed logging of MCP protocol messages and server operations. 