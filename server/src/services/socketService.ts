import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private io: SocketIOServer | null = null;
  // Map of userId -> Set of active socket IDs
  private userSockets: Map<string, Set<string>> = new Map();

  public init(server: HTTPServer, clientOrigin: string) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: clientOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.handshake.query.userId as string;

      if (userId) {
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);
        socket.join(`user:${userId}`);
        // console.log(`[Socket] User ${userId} connected on socket ${socket.id}`);
      }

      socket.on('disconnect', () => {
        if (userId && this.userSockets.has(userId)) {
          const set = this.userSockets.get(userId)!;
          set.delete(socket.id);
          if (set.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        // console.log(`[Socket] Socket ${socket.id} disconnected`);
      });
    });

    return this.io;
  }

  /**
   * Emit an event to a specific user
   */
  public emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast an event to all connected users
   */
  public broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

export const socketService = new SocketService();

