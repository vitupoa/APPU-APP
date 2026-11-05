import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './redis.js';
import { Server as HttpServer } from 'http';
import { env } from '../../config/env.js';

export let io: SocketServer;

export function initializeGateway(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // Attach Redis Adapter for horizontal clustered scaling
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    // Join secure room authenticated mapping
    socket.on('authenticate', (data) => {
      // Expecting { user_id: string } natively
      if (data && data.user_id) {
        socket.join(`user:${data.user_id}`);
        }
    });

    socket.on('disconnect', () => {
      });
  });

  return io;
}
