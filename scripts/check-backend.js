const { spawn } = require('child_process');
const path = require('path');

console.log('Starting backend with error logging...');

const backendPath = path.join(__dirname, '..', 'backend');
process.chdir(backendPath);

const child = spawn('npx', ['ts-node', 'src/index.ts'], {
  cwd: backendPath,
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe']
});

let outputBuffer = '';

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  outputBuffer += output;
});

child.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  outputBuffer += output;
});

child.on('error', (error) => {
  console.error('Failed to start backend:', error);
});

child.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  
  // Check if it crashed during task execution
  if (outputBuffer.includes('Starting execution of task')) {
    console.log('\n=== Backend crashed during task execution ===');
    console.log('This might be due to the mock script execution.');
  }
});

// Keep the process running
process.on('SIGINT', () => {
  child.kill();
  process.exit();
});