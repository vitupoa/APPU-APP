import { Server as SocketServer } from 'socket.io';

/**
 * Initializes the Shop Socket.io namespace for real-time product updates.
 */
export function initializeShopSocket(io: SocketServer) {
  io.on('connection', (socket) => {
    // Join shop room to receive all product updates
    socket.on('shop:join', () => {
      socket.join('shop:products');
    });

    // Leave shop room
    socket.on('shop:leave', () => {
      socket.leave('shop:products');
    });
  });
}

/**
 * Emit product created event to all connected clients
 */
export function emitProductCreated(io: SocketServer, product: any) {
  io.to('shop:products').emit('shop:product_created', product);
}

/**
 * Emit product updated event to all connected clients
 */
export function emitProductUpdated(io: SocketServer, product: any) {
  io.to('shop:products').emit('shop:product_updated', product);
}

/**
 * Emit product deleted event to all connected clients
 */
export function emitProductDeleted(io: SocketServer, product_id: string) {
  io.to('shop:products').emit('shop:product_deleted', { product_id });
}
