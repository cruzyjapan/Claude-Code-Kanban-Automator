# Claude Code Setup Guide

## Overview

The Claude Code Kanban Automator requires Claude Code to be installed and accessible for automatic task execution. This guide explains how to configure the system to work with Claude Code.

## Configuration Options

### 1. Using Actual Claude Code (Recommended for Production)

If you have Claude Code installed:

1. Ensure Claude Code is installed and available in your system PATH:
   ```bash
   which claude-code
   # Should output the path to claude-code executable
   ```

2. Update your `.env` file:
   ```env
   CLAUDE_CODE_COMMAND=claude-code
   ```

### 2. Using the Mock Script (For Testing)

For testing purposes without Claude Code installed:

1. The system includes a mock script at `scripts/mock-claude-code.sh`
2. This is already configured in the default `.env` file:
   ```env
   CLAUDE_CODE_COMMAND=./scripts/mock-claude-code.sh
   ```

### 3. Using a Custom Command

You can configure any command or script:

1. Create your custom script
2. Make it executable: `chmod +x your-script.sh`
3. Update `.env`:
   ```env
   CLAUDE_CODE_COMMAND=/path/to/your-script.sh
   ```

## How Tasks are Executed

When a task is set to "requested" status:

1. The system creates a working directory: `claude-code-workspace/<task-id>/`
2. A `prompt.md` file is generated with:
   - Task title and description
   - Any previous feedback
   - Execution context
3. The configured command is executed with the prompt file as an argument
4. Output is captured and stored in the database
5. Task status is updated based on execution result

## Troubleshooting

### "spawn claude-code ENOENT" Error

This error means the command cannot be found. Solutions:

1. **Check the command path**:
   ```bash
   # Test if the command exists
   ls -la $(grep CLAUDE_CODE_COMMAND .env | cut -d= -f2)
   ```

2. **Use absolute path**:
   ```env
   CLAUDE_CODE_COMMAND=/usr/local/bin/claude-code
   ```

3. **Use the mock script for testing**:
   ```env
   CLAUDE_CODE_COMMAND=./scripts/mock-claude-code.sh
   ```

### Tasks Not Executing

1. Check the task monitor is running (check backend logs)
2. Ensure task status is "requested"
3. Check `MAX_CONCURRENT_TASKS` in `.env` (default: 3)
4. Review backend logs for execution errors

## Custom Integration

To integrate with your own automation tool:

1. Your script should:
   - Accept a prompt file path as the first argument
   - Read the prompt file for task details
   - Execute the required actions
   - Exit with code 0 for success, non-zero for failure
   - Output results to stdout (will be captured)

2. Example custom script:
   ```bash
   #!/bin/bash
   PROMPT_FILE="$1"
   
   # Your automation logic here
   echo "Processing task..."
   
   # Success
   exit 0
   ```

## Environment Variables

- `CLAUDE_CODE_COMMAND`: Command to execute (default: `claude-code`)
- `CLAUDE_CODE_WORK_DIR`: Working directory for executions (default: `./claude-code-workspace`)
- `MAX_CONCURRENT_TASKS`: Maximum parallel executions (default: 3)
- `TASK_CHECK_INTERVAL`: How often to check for new tasks in ms (default: 60000)