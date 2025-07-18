import { server, wsService, notificationService, app } from './app';
import { getDatabase } from './services/database.service';
import { ClaudeCodeExecutor } from './services/claude-code-executor.service';
import { TaskExecutionMonitor } from './services/task-execution-monitor.service';
import { TaskService } from './services/task.service';
import { ExecutionService } from './services/execution.service';
import { SettingsService } from './services/settings.service';
import { createStuckTaskDetector } from './services/stuck-task-detector.service';
import { setStuckTaskDetector } from './routes/stuck-task.routes';
import { TaskActivityUpdater } from './services/task-activity-updater.service';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env['PORT'] || 5000;
const HOST = process.env['HOST'] || 'localhost';

// Ensure database is initialized
const db = getDatabase();

// Initialize Claude Code executor
// Resolve workspace directory path
const workDir = process.env['CLAUDE_CODE_WORK_DIR'] || path.join(__dirname, '../../claude-code-workspace');
// Resolve relative paths from project root, not backend directory
const projectRoot = path.join(__dirname, '../..');
const resolvedWorkDir = path.isAbsolute(workDir) ? workDir : path.resolve(projectRoot, workDir);

const executorConfig = {
  claudeCodeCommand: process.env['CLAUDE_CODE_COMMAND'] || 'claude-code',
  workDir: resolvedWorkDir,
  maxConcurrentTasks: parseInt(process.env['MAX_CONCURRENT_TASKS'] || '3'),
  retryLimit: 3
};

console.log('Claude Code Executor Config:', {
  claudeCodeCommand: executorConfig.claudeCodeCommand,
  workDir: executorConfig.workDir,
  maxConcurrentTasks: executorConfig.maxConcurrentTasks
});

const claudeCodeExecutor = new ClaudeCodeExecutor(executorConfig, notificationService, wsService);
const taskService = new TaskService();
taskService.setWebSocketService(wsService);
const executionService = new ExecutionService();
const settingsService = new SettingsService();

// Initialize task execution monitor
const taskMonitor = new TaskExecutionMonitor(
  claudeCodeExecutor,
  taskService,
  parseInt(process.env['TASK_CHECK_INTERVAL'] || '60000'),
  executorConfig.maxConcurrentTasks
);

// Initialize stuck task detector
const stuckTaskDetector = createStuckTaskDetector(
  taskService,
  executionService,
  notificationService,
  settingsService
);
stuckTaskDetector.setWebSocketService(wsService);
setStuckTaskDetector(stuckTaskDetector);

// Initialize task activity updater
const taskActivityUpdater = new TaskActivityUpdater();
console.log('✅ Task activity updater initialized');

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`📊 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`🔌 WebSocket available at ws://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  
  // Start task execution monitor
  taskMonitor.start();
  console.log(`🤖 Task execution monitor started`);
  
  // Start stuck task detector
  stuckTaskDetector.start();
  console.log(`🔍 Stuck task detector started`);
  
  // Start task activity updater
  taskActivityUpdater.startUpdating();
  console.log(`🔄 Task activity updater started`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('\n📦 Gracefully shutting down...');
  
  // Stop task monitor
  taskMonitor.stop();
  console.log('✅ Task monitor stopped');
  
  // Stop stuck task detector
  stuckTaskDetector.stop();
  console.log('✅ Stuck task detector stopped');
  
  // Stop task activity updater
  taskActivityUpdater.stopUpdating();
  console.log('✅ Task activity updater stopped');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    db.close();
    
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}