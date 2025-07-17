const { spawn } = require('child_process');
const path = require('path');

// Test the mock script execution
const scriptPath = path.join(__dirname, 'mock-claude-code.sh');
const testPromptPath = '/tmp/test-prompt.md';

// Create a test prompt file
const fs = require('fs');
fs.writeFileSync(testPromptPath, '# Test Task\n\nThis is a test task.');

console.log('Testing script execution...');
console.log('Script path:', scriptPath);
console.log('Exists:', fs.existsSync(scriptPath));
console.log('Executable:', fs.statSync(scriptPath).mode & 0o111);

const child = spawn(scriptPath, [testPromptPath], {
  cwd: '/tmp',
  env: { ...process.env, CLAUDE_CODE_TASK_ID: 'test-123' }
});

child.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

child.on('error', (error) => {
  console.error('ERROR:', error);
});

child.on('close', (code) => {
  console.log('Process exited with code:', code);
});