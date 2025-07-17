import { Request, Response } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export class ClaudeTestController {
  async testConnection(req: Request, res: Response): Promise<void> {
    const claudeCodeCommand = process.env.CLAUDE_CODE_COMMAND || 'claude-code';
    const workDir = process.env.CLAUDE_CODE_WORK_DIR || './claude-code-workspace';
    
    try {
      console.log('Testing Claude Code connection...');
      
      // Create a temporary test directory
      const testDir = path.join(workDir, `test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      
      // Create a simple test prompt
      const testPrompt = 'Please respond with exactly: HELLO WORLD';
      const promptFile = path.join(testDir, 'test-prompt.md');
      await fs.writeFile(promptFile, testPrompt, 'utf8');
      
      let output = '';
      let error = '';
      const startTime = Date.now();
      
      const result = await new Promise<{ success: boolean; output: string; error?: string; responseTime: number }>((resolve) => {
        let claudeCode;
        
        // Handle different Claude Code commands
        if (claudeCodeCommand === 'claude') {
          // Real Claude Code CLI - use stdin with permission mode
          claudeCode = spawn(claudeCodeCommand, ['--print', '--permission-mode', 'bypassPermissions'], {
            cwd: testDir,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          // Send prompt via stdin
          claudeCode.stdin.write(testPrompt);
          claudeCode.stdin.end();
        } else if (claudeCodeCommand.endsWith('.sh')) {
          // Mock script
          claudeCode = spawn(claudeCodeCommand, [promptFile], {
            cwd: testDir,
            env: { ...process.env }
          });
        } else {
          // Default: try passing prompt via stdin
          claudeCode = spawn(claudeCodeCommand, [], {
            cwd: testDir,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          claudeCode.stdin.write(testPrompt);
          claudeCode.stdin.end();
        }
        
        // Set a timeout
        const timeoutId = setTimeout(() => {
          claudeCode.kill('SIGTERM');
          resolve({
            success: false,
            output: '',
            error: 'Connection test timed out after 30 seconds',
            responseTime: Date.now() - startTime
          });
        }, 30000);
        
        claudeCode.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        claudeCode.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        claudeCode.on('close', (code) => {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          
          if (code === 0 && output.includes('HELLO WORLD')) {
            resolve({
              success: true,
              output: output.trim(),
              responseTime
            });
          } else {
            resolve({
              success: false,
              output: output.trim(),
              error: error || `Process exited with code ${code}`,
              responseTime
            });
          }
        });
        
        claudeCode.on('error', (err) => {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            output: '',
            error: err.message,
            responseTime: Date.now() - startTime
          });
        });
      });
      
      // Clean up test directory
      try {
        await fs.rm(testDir, { recursive: true });
      } catch (cleanupError) {
        console.error('Failed to clean up test directory:', cleanupError);
      }
      
      console.log('Claude Code test result:', result);
      
      res.json({
        success: result.success,
        message: result.success ? 'Claude Code is responding correctly' : 'Claude Code test failed',
        output: result.output,
        error: result.error,
        responseTime: result.responseTime,
        command: claudeCodeCommand
      });
      
    } catch (error: any) {
      console.error('Claude Code test error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test Claude Code connection',
        error: error.message,
        command: claudeCodeCommand
      });
    }
  }
}