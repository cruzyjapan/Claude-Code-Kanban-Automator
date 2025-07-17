#!/bin/bash

echo "🧹 Cleaning up processes..."

# Kill all Node.js related processes
pkill -f "node" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Kill processes on specific ports
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ Cleanup complete"