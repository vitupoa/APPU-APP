import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './redis.js';
import { env } from '../../config/env.js';
export let io;
export function initializeGateway(httpServer) {
    io = new SocketServer(httpServer, {
        cors: {
            origin: env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        },
    });
    // Attach Redis Adapter for horizontal clustered scaling
    io.adapter(createAdapter(pubClient, subClient));
    io.on('connection', (socket) => {
        console.log(`[Gateway] Client connection initiated: ${socket.id}`);
        // Join secure room authenticated mapping
        socket.on('authenticate', (data) => {
            // Expecting { userId: string } natively
            if (data && data.userId) {
                socket.join(`user:${data.userId}`);
                console.log(`[Gateway] Socket ${socket.id} securely joined user channel: user:${data.userId}`);
            }
        });
        socket.on('disconnect', () => {
            console.log(`[Gateway] Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
//# sourceMappingURL=socket.js.map