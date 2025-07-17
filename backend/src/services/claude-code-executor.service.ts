import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { Task, Execution, Feedback } from '../types';
import { getDatabase } from './database.service';
import { TaskService } from './task.service';
import { ExecutionService } from './execution.service';
import { FeedbackService } from './feedback.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { attachmentService } from './attachment.service';

interface ExecutorConfig {
  claudeCodeCommand: string;
  workDir: string;
  maxConcurrentTasks: number;
  retryLimit: number;
}

export class ClaudeCodeExecutor extends EventEmitter {
  private config: ExecutorConfig;
  private runningTasks: Map<string, ChildProcessWithoutNullStreams> = new Map();
  private taskService: TaskService;
  private executionService: ExecutionService;
  private feedbackService: FeedbackService;
  private notificationService: NotificationService;
  private wsService: WebSocketService;

  constructor(config: ExecutorConfig, notificationService: NotificationService, wsService: WebSocketService) {
    super();
    this.config = config;
    this.taskService = new TaskService();
    this.executionService = new ExecutionService();
    this.feedbackService = new FeedbackService();
    this.notificationService = notificationService;
    this.wsService = wsService;
  }

  async executeTask(task: Task): Promise<void> {
    const taskWorkDir = path.join(this.config.workDir, task.id);
    console.log(`[ClaudeCodeExecutor] Starting execution for task ${task.id} (version: ${task.version})`);
    console.log(`[ClaudeCodeExecutor] Work directory: ${taskWorkDir}`);
    
    try {
      // Archive previous outputs if this is a re-execution (version > 1)
      if (task.version > 1) {
        await this.archivePreviousOutputs(taskWorkDir, task.version - 1);
      }
      
      // Create or clean work directory
      await fs.mkdir(taskWorkDir, { recursive: true });
      console.log(`[ClaudeCodeExecutor] Prepared work directory`);

      // Get unaddressed feedback
      const feedbacks = await this.feedbackService.getUnaddressedFeedback(task.id);

      // Create execution record
      const execution = await this.executionService.createExecution(task.id, task.version);

      // Update task status
      await this.taskService.updateTask(task.id, { status: 'working' });
      await this.notificationService.notifyTaskStatusChange(task.id, task.title, 'requested', 'working');

      // Create prompt file
      const promptPath = path.join(taskWorkDir, 'prompt.md');
      await this.createPromptFile(promptPath, task, feedbacks);

      // Execute Claude Code
      console.log(`[ClaudeCodeExecutor] Running Claude Code command: ${this.config.claudeCodeCommand}`);
      const result = await this.runClaudeCode(task.id, execution.id, promptPath, taskWorkDir);
      console.log(`[ClaudeCodeExecutor] Execution result:`, result);

      if (result.success) {
        // Update execution with success
        await this.executionService.updateExecution(execution.id, {
          status: 'completed',
          output_path: taskWorkDir,
          execution_logs: result.output
        });

        // Mark feedback as addressed
        if (feedbacks.length > 0) {
          for (const feedback of feedbacks) {
            await this.feedbackService.markFeedbackAsAddressed(feedback.id, task.version);
          }
          await this.notificationService.notifyFeedbackComplete(task.id, task.title);
        }

        // Update task status to review
        await this.taskService.updateTask(task.id, { status: 'review' });
        await this.notificationService.notifyTaskStatusChange(task.id, task.title, 'working', 'review');
        
        // Record output files
        await this.recordOutputFiles(task.id, execution.id, taskWorkDir);

      } else {
        // Handle failure
        await this.executionService.updateExecution(execution.id, {
          status: 'failed',
          error_message: result.error,
          execution_logs: result.output
        });

        // Check retry count
        const retryCount = execution.retry_count + 1;
        if (retryCount < this.config.retryLimit) {
          await this.executionService.incrementRetryCount(execution.id);
          // Re-queue the task
          await this.taskService.updateTask(task.id, { status: 'requested' });
        } else {
          // Max retries reached
          await this.taskService.updateTask(task.id, { status: 'pending' });
          await this.notificationService.notifyTaskError(task.id, task.title, result.error || 'Max retries reached');
        }
      }

    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      await this.taskService.updateTask(task.id, { status: 'pending' });
      await this.notificationService.notifyTaskError(task.id, task.title, String(error));
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  private async createPromptFile(filePath: string, task: Task, feedbacks: Feedback[]): Promise<void> {
    let prompt = `# タスク: ${task.title}\n\n`;
    
    if (task.description) {
      prompt += `## 説明\n${task.description}\n\n`;
    }
    
    // Add note about available tools and permissions
    prompt += `## 利用可能なツールと権限\n`;
    prompt += `このタスクを実行する際、以下のツールが利用可能です：\n`;
    prompt += `- Writeツール: ファイルの作成と編集（標準権限）\n`;
    prompt += `- Readツール: ファイルの読み取り\n`;
    prompt += `- Bashツール: コマンドの実行（標準権限）\n`;
    prompt += `- その他のコード実行に必要なツール\n\n`;
    prompt += `**注意**: 標準権限で実行されています。ファイル操作に一部制限があります。\n\n`;
    
    // Get custom prompt instructions from user settings
    try {
      const db = await getDatabase();
      const settings = await db.get(
        'SELECT custom_prompt_instructions FROM user_settings WHERE user_id = ?',
        ['default']
      );
      
      if (settings?.custom_prompt_instructions) {
        prompt += `## カスタム指示\n${settings.custom_prompt_instructions}\n\n`;
      }
    } catch (error) {
      console.error('[ClaudeCodeExecutor] Error loading custom prompt instructions:', error);
    }

    // Get and include attachments
    const attachments = await attachmentService.getAttachmentsByTaskId(task.id);
    if (attachments.length > 0) {
      prompt += `## 添付ファイル\n`;
      for (const attachment of attachments) {
        prompt += `- ${attachment.file_name} (${attachment.file_type || 'unknown type'})\n`;
        
        // Copy attachments to working directory for Claude Code to access
        const destPath = path.join(path.dirname(filePath), 'attachments', attachment.file_name);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(attachment.file_path, destPath);
        
        prompt += `  ファイルパス: ./attachments/${attachment.file_name}\n`;
      }
      prompt += `\n添付ファイルは ./attachments/ ディレクトリ内にあります。必要に応じて参照してください。\n\n`;
    }

    if (feedbacks.length > 0) {
      prompt += `## フィードバック\n`;
      for (const feedback of feedbacks) {
        prompt += `### ${feedback.created_at.toLocaleString()}\n`;
        prompt += `${feedback.content}\n\n`;
      }
      prompt += `\n前回の成果物を参照し、上記フィードバックを反映してください。\n`;
    }

    if (task.due_date) {
      prompt += `\n## 期限\n${task.due_date.toLocaleString()}\n`;
    }

    if (task.estimated_hours) {
      prompt += `\n## 推定作業時間\n${task.estimated_hours}時間\n`;
    }

    await fs.writeFile(filePath, prompt, 'utf8');
  }

  private runClaudeCode(
    taskId: string,
    executionId: string,
    promptPath: string,
    workDir: string
  ): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise(async (resolve) => {
      // Read prompt content
      const promptContent = await fs.readFile(promptPath, 'utf8');
      
      // Get task info for notifications
      const task = await this.taskService.getTaskById(taskId);
      
      let args: string[] = [];
      if (this.config.claudeCodeCommand === 'claude') {
        // Use stdin instead of arguments to avoid shell escaping issues
        args = ['--print', '--permission-mode', 'bypassPermissions'];
      } else if (this.config.claudeCodeCommand.endsWith('.sh')) {
        args = [promptPath];
      }
      
      console.log(`[ClaudeCodeExecutor] Spawning process:`, {
        command: this.config.claudeCodeCommand,
        args: args,
        cwd: workDir
      });

      // Set up timeout (5 minutes)
      const timeoutMs = 5 * 60 * 1000; // 5 minutes
      let timeoutId: NodeJS.Timeout;
      let slowResponseTimeout: NodeJS.Timeout;
      let isResolved = false;

      const resolveOnce = (result: { success: boolean; output: string; error?: string }) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          clearTimeout(slowResponseTimeout);
          resolve(result);
        }
      };

      // Try with different approaches based on the command
      let claudeCode;
      
      if (this.config.claudeCodeCommand === 'claude') {
        // For real Claude Code CLI, use stdin with permission mode
        claudeCode = spawn(this.config.claudeCodeCommand, ['--print', '--permission-mode', 'bypassPermissions'], {
          cwd: workDir,
          env: { ...process.env, CLAUDE_CODE_TASK_ID: taskId },
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Send prompt via stdin
        claudeCode.stdin.write(promptContent);
        claudeCode.stdin.end();
      } else if (this.config.claudeCodeCommand.endsWith('.sh')) {
        // For mock script, pass prompt file as argument
        claudeCode = spawn(this.config.claudeCodeCommand, [promptPath], {
          cwd: workDir,
          env: { ...process.env, CLAUDE_CODE_TASK_ID: taskId }
        });
      } else {
        // Default: try passing prompt via stdin
        claudeCode = spawn(this.config.claudeCodeCommand, [], {
          cwd: workDir,
          env: { ...process.env, CLAUDE_CODE_TASK_ID: taskId },
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Send prompt via stdin
        claudeCode.stdin.write(promptContent);
        claudeCode.stdin.end();
      }

      this.runningTasks.set(taskId, claudeCode);

      // Set up slow response notification (after 30 seconds)
      slowResponseTimeout = setTimeout(async () => {
        if (this.runningTasks.has(taskId)) {
          console.log(`[ClaudeCodeExecutor] Task ${taskId} is taking longer than expected`);
          
          // Send notification about slow response
          await this.notificationService.createNotification({
            task_id: taskId,
            type: 'system_info',
            title: 'notification.claude.slow.title',
            message: `notification.claude.slow.message|${task.title}`,
            priority: 'medium'
          });
        }
      }, 30000); // 30 seconds

      // Set up timeout
      timeoutId = setTimeout(() => {
        console.log(`[ClaudeCodeExecutor] Task ${taskId} timed out after ${timeoutMs}ms`);
        try {
          claudeCode.kill('SIGTERM');
          // If SIGTERM doesn't work, try SIGKILL after 5 seconds
          setTimeout(() => {
            if (this.runningTasks.has(taskId)) {
              console.log(`[ClaudeCodeExecutor] Force killing task ${taskId}`);
              claudeCode.kill('SIGKILL');
            }
          }, 5000);
        } catch (err) {
          console.error(`[ClaudeCodeExecutor] Error killing process:`, err);
        }
        this.runningTasks.delete(taskId);
        resolveOnce({ 
          success: false, 
          output: output || '', 
          error: `Task timed out after ${timeoutMs / 1000} seconds` 
        });
      }, timeoutMs);

      claudeCode.on('error', (err) => {
        console.error(`[ClaudeCodeExecutor] Spawn error:`, err);
        this.runningTasks.delete(taskId);
        resolveOnce({ 
          success: false, 
          output: '', 
          error: err.message 
        });
      });

      let output = '';
      let error = '';

      claudeCode.stdout.on('data', async (data) => {
        const chunk = data.toString();
        output += chunk;
        
        // Update last activity time
        try {
          await getDatabase().run(
            'UPDATE executions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?',
            [executionId]
          );
        } catch (err) {
          console.error('Failed to update last activity:', err);
        }
        
        // Send progress updates via WebSocket
        this.wsService.broadcastExecutionProgress(taskId, {
          executionId,
          output: chunk,
          timestamp: new Date()
        });
      });

      claudeCode.stderr.on('data', (data) => {
        error += data.toString();
      });

      claudeCode.on('close', async (code) => {
        this.runningTasks.delete(taskId);
        
        console.log(`[ClaudeCodeExecutor] Process closed with code ${code}`);
        console.log(`[ClaudeCodeExecutor] Output length: ${output.length}`);
        console.log(`[ClaudeCodeExecutor] Error output: ${error}`);
        
        if (code === 0) {
          // Save Claude Code output to file
          const outputFilename = `claude_output_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
          const outputPath = path.join(workDir, outputFilename);
          
          try {
            await fs.writeFile(outputPath, output || 'No output received', 'utf8');
            console.log(`[ClaudeCodeExecutor] Output saved to: ${outputPath}`);
          } catch (err) {
            console.error(`[ClaudeCodeExecutor] Failed to save output:`, err);
          }
          
          resolveOnce({ success: true, output: output || 'Task completed successfully' });
        } else {
          resolveOnce({ 
            success: false, 
            output, 
            error: error || `Process exited with code ${code}` 
          });
        }
      });

      claudeCode.on('error', (err) => {
        this.runningTasks.delete(taskId);
        resolveOnce({ 
          success: false, 
          output, 
          error: err.message 
        });
      });
    });
  }

  private async recordOutputFiles(taskId: string, executionId: string, workDir: string): Promise<void> {
    console.log(`[ClaudeCodeExecutor] Recording output files for task ${taskId} in ${workDir}`);
    try {
      const files = await fs.readdir(workDir);
      console.log(`[ClaudeCodeExecutor] Found ${files.length} files in output directory`);
      
      for (const file of files) {
        if (file === 'prompt.md') {
          console.log(`[ClaudeCodeExecutor] Skipping prompt.md`);
          continue; // Skip prompt file
        }
        
        const filePath = path.join(workDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const sql = `
            INSERT INTO output_files (id, task_id, execution_id, file_path, file_name, file_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const fileExt = path.extname(file).toLowerCase();
          
          console.log(`[ClaudeCodeExecutor] Recording file: ${file} (${stats.size} bytes)`);
          
          await getDatabase().run(sql, [
            fileId,
            taskId,
            executionId,
            filePath,
            file,
            fileExt,
            stats.size
          ]);
          
          console.log(`[ClaudeCodeExecutor] File recorded successfully: ${fileId}`);
        }
      }
    } catch (error) {
      console.error('[ClaudeCodeExecutor] Error recording output files:', error);
    }
  }

  async pauseTask(taskId: string): Promise<boolean> {
    const process = this.runningTasks.get(taskId);
    if (process) {
      process.kill('SIGTERM');
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }

  getRunningTaskCount(): number {
    return this.runningTasks.size;
  }

  private async archivePreviousOutputs(workDir: string, previousVersion: number): Promise<void> {
    try {
      const archiveDir = `${workDir}_v${previousVersion}_${Date.now()}`;
      console.log(`[ClaudeCodeExecutor] Archiving previous outputs to: ${archiveDir}`);
      
      // Check if work directory exists
      try {
        await fs.access(workDir);
      } catch {
        console.log(`[ClaudeCodeExecutor] No previous outputs to archive`);
        return;
      }
      
      // Create archive directory
      await fs.mkdir(archiveDir, { recursive: true });
      
      // Move all files except prompt.md to archive
      const files = await fs.readdir(workDir);
      for (const file of files) {
        if (file !== 'prompt.md') {
          const srcPath = path.join(workDir, file);
          const destPath = path.join(archiveDir, file);
          await fs.rename(srcPath, destPath);
          console.log(`[ClaudeCodeExecutor] Archived: ${file}`);
        }
      }
      
      // Clean the work directory for new execution
      const remainingFiles = await fs.readdir(workDir);
      for (const file of remainingFiles) {
        await fs.unlink(path.join(workDir, file));
      }
      
    } catch (error) {
      console.error(`[ClaudeCodeExecutor] Error archiving outputs:`, error);
      // Continue execution even if archiving fails
    }
  }

  isTaskRunning(taskId: string): boolean {
    return this.runningTasks.has(taskId);
  }
}