import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { WebSocketService } from './services/websocket.service';
import { NotificationService } from './services/notification.service';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Initialize Notification service with WebSocket
const notificationService = new NotificationService(wsService);

// Store services in app locals for access in controllers
app.locals['wsService'] = wsService;
app.locals['notificationService'] = notificationService;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' 
    ? process.env['FRONTEND_URL'] 
    : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting - disabled for development
if (process.env['NODE_ENV'] === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs in production only
  });
  app.use('/api', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for outputs
app.use('/outputs', express.static(path.join(__dirname, '../../outputs')));

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    websocket_clients: wsService.getConnectedClients()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app, server, wsService, notificationService };