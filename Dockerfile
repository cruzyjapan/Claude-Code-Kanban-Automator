# Multi-stage build for production

# Stage 1: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/tsconfig*.json ./
COPY frontend/index.html ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/src ./src
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install SQLite3 and Claude Code
RUN apk add --no-cache sqlite

# Copy backend files
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy necessary files
COPY package.json ./
COPY .env.example ./.env.example
COPY config.json ./
COPY database/schema.sql ./database/
COPY scripts ./scripts

# Create necessary directories
RUN mkdir -p database outputs claude-code-workspace logs

# Set permissions
RUN chmod +x scripts/*.js

# Install root dependencies
RUN npm install --production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start command
CMD ["node", "backend/dist/index.js"]