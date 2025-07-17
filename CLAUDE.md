# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Kanban-style task management system that integrates with Claude Code to provide automated task execution. The system allows users to create tasks, queue them for execution, and have Claude Code automatically work on them in isolated workspaces.

## Key Development Commands

### Database Operations
- `npm run db:init` - Initialize SQLite database with schema and default data
- `npm run db:migrate` - Run database migrations
- `node scripts/check-db.js` - Check database connectivity and structure

### Development Servers
- `npm run dev` - Start both backend and frontend servers (may have issues)
- `npm run dev:backend` - Start backend server only (recommended for separate terminals)
- `npm run dev:frontend` - Start frontend server only (recommended for separate terminals)

### Building
- `npm run build` - Build both backend and frontend for production
- `npm run build:backend` - Build backend TypeScript to JavaScript
- `npm run build:frontend` - Build frontend React/TypeScript for production

### Testing and Linting
- `npm run test` - Run all tests
- `npm run test:backend` - Run backend tests
- `npm run test:frontend` - Run frontend tests  
- `npm run lint` - Run linting on all code
- `npm run lint:backend` - Run backend linting
- `npm run lint:frontend` - Run frontend linting

### Utility Scripts
- `npm run clean` - Kill all Node.js processes
- `npm run restart` - Clean and restart development servers
- `node scripts/check-backend.js` - Check backend health
- `node scripts/check-output-files.js` - Check output file system

## Architecture

### Full-Stack Structure
- **Backend**: Node.js/Express with TypeScript, SQLite database
- **Frontend**: React/TypeScript with Vite, TailwindCSS
- **Real-time**: WebSocket for live updates
- **File System**: Isolated workspaces for Claude Code execution

### Backend Architecture (`backend/src/`)
- **Entry Point**: `index.ts` - Server initialization and service orchestration
- **App Configuration**: `app.ts` - Express app setup, middleware, routing
- **Controllers**: Handle HTTP requests and responses
- **Services**: Core business logic and external integrations
  - `claude-code-executor.service.ts` - Main Claude Code execution orchestration
  - `task-execution-monitor.service.ts` - Monitors and manages task execution queue
  - `websocket.service.ts` - WebSocket communication management
  - `database.service.ts` - SQLite database operations
  - `notification.service.ts` - Notification system
- **Routes**: RESTful API endpoints
- **Types**: TypeScript type definitions

### Frontend Architecture (`frontend/src/`)
- **Entry Point**: `main.tsx` - React app initialization
- **App Component**: `App.tsx` - Root component with routing
- **Pages**: Main application views (Dashboard, TaskDetail, Settings)
- **Components**: Reusable UI components including KanbanBoard, TaskCard
- **Contexts**: React context providers for state management
- **Services**: API communication layer

### Database Schema (`database/schema.sql`)
The SQLite database includes tables for:
- `tasks` - Main task records with status workflow
- `executions` - Task execution attempts and results
- `feedback` - User feedback on completed tasks
- `notifications` - System notifications
- `task_attachments` - File attachments for tasks
- `output_files` - Generated files from Claude Code execution

## Claude Code Integration

### Configuration
- **Command**: Set via `CLAUDE_CODE_COMMAND` environment variable
- **Default**: `claude-code` (real Claude Code CLI)
- **Testing**: `./scripts/mock-claude-code.sh` (mock implementation)
- **Workspace**: `./claude-code-workspace/` - Isolated execution directories

### Execution Flow
1. Task moved to "requested" status triggers execution
2. `ClaudeCodeExecutor` creates isolated workspace directory
3. Prompt file generated with task details, feedback, and attachments
4. Claude Code spawned with workspace as working directory
5. Real-time progress streamed via WebSocket
6. Output files catalogued and stored
7. Task moved to "review" status for human approval

### Task Status Workflow
- `pending` → `requested` → `working` → `review` → `completed`
- Failed tasks can retry up to 3 times before returning to `pending`

## Environment Configuration

### Required Environment Variables
```env
DATABASE_PATH=./database/tasks.db
OUTPUT_DIR=./outputs
CLAUDE_CODE_COMMAND=claude-code
CLAUDE_CODE_WORK_DIR=./claude-code-workspace
PORT=5000
MAX_CONCURRENT_TASKS=3
TASK_CHECK_INTERVAL=60000
```

### Frontend Environment
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## Common Development Patterns

### Adding New API Endpoints
1. Create controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Update main routes in `backend/src/routes/index.ts`
4. Add corresponding frontend API call in `frontend/src/services/api.ts`

### Database Operations
- Use `getDatabase()` from `database.service.ts`
- All database queries should use parameterized statements
- Update schema in `database/schema.sql` and create migration scripts

### WebSocket Communication
- Backend: Use `wsService.broadcast*()` methods
- Frontend: Use `WebSocketContext` to listen for real-time updates

### File Upload/Download
- Uploads stored in `uploads/` directory
- Outputs stored in `outputs/` and `claude-code-workspace/`
- Use `attachment.service.ts` for file operations

## Development Notes

### TypeScript Configuration
- Root `tsconfig.json` with strict settings
- Backend has relaxed settings in `backend/tsconfig.json` for development
- Frontend uses Vite's TypeScript configuration

### Port Configuration
- Backend: Port 5000 (configurable via PORT env var)
- Frontend: Port 3000 (Vite default) or 5173
- WebSocket: Same port as backend

### Mock vs Real Claude Code
- Mock script (`scripts/mock-claude-code.sh`) for testing without Claude Code
- Real integration expects `claude-code` command in PATH
- Task execution adapts automatically based on `CLAUDE_CODE_COMMAND` setting

### Error Handling
- Backend uses structured error handling via `error.middleware.ts`
- Frontend uses React Error Boundaries and toast notifications
- Failed task executions include retry logic with exponential backoff

## Testing Strategy

### Backend Testing
- Unit tests for services and controllers
- Integration tests for database operations
- API endpoint testing with mock data

### Frontend Testing
- Component unit tests
- Integration tests for user workflows
- End-to-end testing for critical paths

### Manual Testing
- Use mock Claude Code script for development
- Test with real Claude Code for production readiness
- Verify WebSocket connections and real-time updates