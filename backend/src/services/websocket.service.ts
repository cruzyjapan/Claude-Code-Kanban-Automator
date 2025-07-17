import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { WebSocketMessage } from '../types';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`WebSocket client connected: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        data: { clientId, message: 'Connected to Claude Code Task Manager' }
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    console.log(`Received message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', data: {} });
        break;
      
      case 'subscribe':
        // Handle subscription to specific events
        break;
      
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  broadcastTaskUpdate(taskId: string, data: any): void {
    this.broadcast({
      type: 'task_update',
      data: { taskId, ...data }
    });
  }

  broadcastQueueUpdate(status: string, taskIds: string[]): void {
    this.broadcast({
      type: 'queue_update',
      data: { status, taskIds }
    });
  }

  broadcastExecutionProgress(taskId: string, progress: any): void {
    this.broadcast({
      type: 'execution_progress',
      data: { taskId, ...progress }
    });
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients(): number {
    return this.clients.size;
  }
}