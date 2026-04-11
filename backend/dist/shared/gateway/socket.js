"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.initializeGateway = initializeGateway;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("./redis");
const env_1 = require("../../config/env");
function initializeGateway(httpServer) {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        },
    });
    // Attach Redis Adapter for horizontal clustered scaling
    exports.io.adapter((0, redis_adapter_1.createAdapter)(redis_1.pubClient, redis_1.subClient));
    exports.io.on('connection', (socket) => {
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
    return exports.io;
}
//# sourceMappingURL=socket.js.map