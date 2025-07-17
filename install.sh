#!/bin/bash

# Claude Code Kanban Automator Installation Script
# This script sets up the application from a fresh clone

echo "🚀 Claude Code Kanban Automator - Installation Script"
echo "=================================================="

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js is not installed. Please install Node.js v18.0.0 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check npm
NPM_VERSION=$(npm -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $NPM_VERSION"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo "----------------------------"

# Root dependencies
echo "Installing root dependencies..."
npm install

# Backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Create required directories
echo ""
echo "📁 Creating directories..."
echo "-------------------------"
mkdir -p database outputs uploads claude-code-workspace logs
echo "✅ Directories created"

# Create environment files
echo ""
echo "⚙️  Creating environment configuration..."
echo "--------------------------------------"

# Backend .env
cat > .env << 'EOF'
# Database
DATABASE_PATH=./database/tasks.db

# Output directory
OUTPUT_DIR=./outputs

# Claude Code settings
# Use mock for testing, replace with 'claude' for real integration
CLAUDE_CODE_COMMAND=./scripts/mock-claude-code.sh
CLAUDE_CODE_WORK_DIR=./claude-code-workspace

# Server settings
PORT=5001
HOST=localhost

# Execution settings
MAX_CONCURRENT_TASKS=3
TASK_CHECK_INTERVAL=5000
RETRY_LIMIT=3

# Security
JWT_SECRET=your-secret-key-here

# Environment
NODE_ENV=development
EOF

echo "✅ Created .env file"

# Frontend .env
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5001/api
VITE_WS_URL=ws://localhost:5001
EOF

echo "✅ Created frontend/.env file"

# Initialize database
echo ""
echo "🗄️  Initializing database..."
echo "-------------------------"

# Create database initialization script
cat > init-db.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = './database/tasks.db';
const schemaPath = './database/schema.sql';

try {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const db = new sqlite3.Database(dbPath);

  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    }
    console.log('✅ Database initialized successfully');
    db.close();
  });
} catch (error) {
  console.error('❌ Error reading schema:', error);
  process.exit(1);
}
EOF

node init-db.js
rm init-db.js

# Make mock claude-code script executable
if [ -f "./scripts/mock-claude-code.sh" ]; then
    chmod +x ./scripts/mock-claude-code.sh
    echo "✅ Mock Claude Code script is executable"
fi

# Check if Claude Code is installed
echo ""
echo "🤖 Checking Claude Code installation..."
echo "-------------------------------------"

if command -v claude &> /dev/null; then
    echo "✅ Claude Code is installed"
    echo ""
    read -p "Would you like to use real Claude Code instead of mock? (y/N): " use_real_claude
    if [[ $use_real_claude =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|CLAUDE_CODE_COMMAND=.*|CLAUDE_CODE_COMMAND=claude|' .env
        else
            sed -i 's|CLAUDE_CODE_COMMAND=.*|CLAUDE_CODE_COMMAND=claude|' .env
        fi
        echo "✅ Configured to use real Claude Code"
    else
        echo "✅ Configured to use mock Claude Code (for testing)"
    fi
else
    echo "ℹ️  Claude Code not found. Using mock for testing."
    echo "   To install Claude Code, visit: https://docs.anthropic.com/claude-code"
fi

# Success message
echo ""
echo "✨ Installation completed successfully!"
echo "======================================"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Or start services separately:"
echo "  Terminal 1: npm run dev:backend"
echo "  Terminal 2: npm run dev:frontend"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5001/api"
echo ""
echo "Note: If port 5173 is in use, Vite will use the next available port."
echo ""
echo "Happy coding! 🎉"