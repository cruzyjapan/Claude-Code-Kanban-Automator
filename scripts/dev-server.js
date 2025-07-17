#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  log('❌ .env file not found. Creating from .env.example...', colors.yellow);
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log('✅ .env file created', colors.green);
  }
}

// Check if database exists
const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
if (!fs.existsSync(dbPath)) {
  log('❌ Database not found. Running db:init...', colors.yellow);
  const initDb = spawn('npm', ['run', 'db:init'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  initDb.on('close', (code) => {
    if (code === 0) {
      log('✅ Database initialized', colors.green);
      startServers();
    } else {
      log('❌ Database initialization failed', colors.red);
      process.exit(1);
    }
  });
} else {
  startServers();
}

function startServers() {
  log('\n🚀 Starting development servers...', colors.bright);
  
  // Start backend
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  let backendReady = false;

  backend.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Add [Backend] prefix to each line
    output.split('\n').forEach(line => {
      if (line.trim()) {
        process.stdout.write(`${colors.blue}[Backend]${colors.reset} ${line}\n`);
      }
    });

    // Check if backend is ready
    if (output.includes('Server is running')) {
      backendReady = true;
      log('✅ Backend ready at http://localhost:5000', colors.green);
    }
  });

  backend.stderr.on('data', (data) => {
    const output = data.toString();
    output.split('\n').forEach(line => {
      if (line.trim()) {
        process.stderr.write(`${colors.red}[Backend Error]${colors.reset} ${line}\n`);
      }
    });
  });

  // Start frontend after a short delay
  setTimeout(() => {
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'frontend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Add [Frontend] prefix to each line
      output.split('\n').forEach(line => {
        if (line.trim()) {
          process.stdout.write(`${colors.cyan}[Frontend]${colors.reset} ${line}\n`);
        }
      });

      // Check if frontend is ready
      if (output.includes('Local:')) {
        log('✅ Frontend ready at http://localhost:3000', colors.green);
        log('\n✨ Development environment is ready!', colors.bright);
        log('📝 Press Ctrl+C to stop all servers\n', colors.dim);
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      output.split('\n').forEach(line => {
        if (line.trim() && !line.includes('MODULE_TYPELESS_PACKAGE_JSON')) {
          process.stderr.write(`${colors.red}[Frontend Error]${colors.reset} ${line}\n`);
        }
      });
    });

    // Handle process termination
    const cleanup = () => {
      log('\n🛑 Shutting down servers...', colors.yellow);
      
      // Kill both processes
      try {
        process.kill(-backend.pid);
        process.kill(-frontend.pid);
      } catch (e) {
        // Ignore errors
      }
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    backend.on('exit', (code) => {
      log(`Backend exited with code ${code}`, colors.red);
      cleanup();
    });
    
    frontend.on('exit', (code) => {
      log(`Frontend exited with code ${code}`, colors.red);
      cleanup();
    });
  }, 2000);
}

// Keep the main process running
process.stdin.resume();