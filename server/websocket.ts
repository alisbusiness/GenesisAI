import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export class GreenGenesisWebSocket {
  private wss: WebSocketServer;
  
  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws' 
    });
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');

      // Send initial connection message
      this.sendToClient(ws, {
        type: 'connection_established',
        data: { 
          message: 'Connected to Green Genesis WebSocket server',
          timestamp: new Date().toISOString()
        }
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      });

      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`WebSocket connection closed: ${code} - ${reason.toString()}`);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToClient(ws, {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() }
          });
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() }
        });
        break;

      case 'subscribe':
        // Handle subscription requests
        console.log('Client subscribed to:', message.data?.topic);
        break;

      case 'unsubscribe':
        // Handle unsubscription requests
        console.log('Client unsubscribed from:', message.data?.topic);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  public broadcast(message: WebSocketMessage): void {
    const messageString = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    });
  }

  public getConnectedClients(): number {
    return this.wss.clients.size;
  }

  public close(): void {
    this.wss.close();
  }
}
