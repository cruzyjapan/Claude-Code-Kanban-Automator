#!/bin/bash

echo "🚀 Starting Claude Code Kanban Automator Development Environment"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

sleep 2

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "✨ Development environment is ready!"
echo ""
echo "📌 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "📝 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop all services, press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Keep script running
wait