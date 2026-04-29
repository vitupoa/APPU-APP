import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from '../config/database.js';
import { verifyToken } from '../modules/auth/auth.service.js';

export function initializeLiveSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/live'
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[LiveSocket] User connected: ${socket.data.userId}`);

    // Join stream room
    socket.on('viewer:join', async (data: { streamId: string }) => {
      const { streamId } = data;
      socket.join(`stream:${streamId}`);
      socket.data.streamId = streamId;

      try {
        // Update viewer count
        await prisma.liveStream.update({
          where: { id: streamId },
          data: { viewerCount: { increment: 1 } }
        });

        // Create viewer record
        await prisma.liveViewer.upsert({
          where: {
            streamId_userId: {
              streamId,
              userId: socket.data.userId
            }
          },
          create: {
            streamId,
            userId: socket.data.userId,
            joinedAt: new Date()
          },
          update: {
            leftAt: null
          }
        });

        // Get updated viewer count
        const stream = await prisma.liveStream.findUnique({
          where: { id: streamId },
          select: { viewerCount: true }
        });

        // Broadcast viewer joined
        io.to(`stream:${streamId}`).emit('viewer:joined', {
          viewerCount: stream?.viewerCount || 0,
          userId: socket.data.userId,
          username: socket.data.username,
          action: 'joined'
        });

        console.log(`[LiveSocket] User ${socket.data.userId} joined stream ${streamId}`);
      } catch (error) {
        console.error('[LiveSocket] Error joining stream:', error);
      }
    });

    // Send message
    socket.on('message:send', async (data: {
      id: string;
      userId: string;
      username: string;
      avatarUrl: string | null;
      text: string;
    }) => {
      const streamId = socket.data.streamId;
      if (!streamId) return;

      try {
        // Save message to database
        const message = await prisma.liveMessage.create({
          data: {
            streamId,
            userId: socket.data.userId,
            text: data.text,
            isSystem: false,
            isPinned: false
          }
        });

        // Broadcast message to all viewers
        io.to(`stream:${streamId}`).emit('message', {
          id: message.id,
          userId: socket.data.userId,
          username: socket.data.username,
          avatarUrl: data.avatarUrl,
          text: data.text,
          isSystem: false,
          isPinned: false,
          timestamp: message.createdAt.getTime()
        });
      } catch (error) {
        console.error('[LiveSocket] Error sending message:', error);
      }
    });

    // Send like
    socket.on('like:send', async (data: {
      userId: string;
      username: string;
      count: number;
    }) => {
      const streamId = socket.data.streamId;
      if (!streamId) return;

      try {
        // Update likes count
        await prisma.liveStream.update({
          where: { id: streamId },
          data: { likesCount: { increment: data.count } }
        });

        // Update viewer likes
        await prisma.liveViewer.updateMany({
          where: {
            streamId,
            userId: socket.data.userId
          },
          data: {
            likesGiven: { increment: data.count }
          }
        });

        // Broadcast like
        io.to(`stream:${streamId}`).emit('like:received', {
          userId: socket.data.userId,
          username: socket.data.username,
          count: data.count
        });
      } catch (error) {
        console.error('[LiveSocket] Error sending like:', error);
      }
    });

    // Send tip
    socket.on('tip:send', async (data: {
      id: string;
      senderId: string;
      senderName: string;
      senderAvatar: string | null;
      recipientId: string;
      amountKr: number;
      message: string | null;
      giftType: string | null;
    }) => {
      const streamId = socket.data.streamId;
      if (!streamId) return;

      try {
        // Process tip transaction
        await prisma.$transaction(async (tx) => {
          // Deduct from sender
          await tx.wallet.update({
            where: { userId: data.senderId },
            data: { krBalance: { decrement: data.amountKr } }
          });

          // Add to recipient
          await tx.wallet.update({
            where: { userId: data.recipientId },
            data: { krBalance: { increment: data.amountKr } }
          });

          // Record transaction
          await tx.transaction.createMany({
            data: [
              {
                userId: data.senderId,
                type: 'tip_sent',
                amountKr: data.amountKr,
                status: 'completed',
                provider: 'platform',
                counterpartyId: data.recipientId
              },
              {
                userId: data.recipientId,
                type: 'tip_received',
                amountKr: data.amountKr,
                status: 'completed',
                provider: 'platform',
                counterpartyId: data.senderId
              }
            ]
          });

          // Record live tip
          await tx.liveTip.create({
            data: {
              streamId,
              senderId: data.senderId,
              recipientId: data.recipientId,
              amountKr: data.amountKr,
              giftType: data.giftType,
              message: data.message
            }
          });

          // Update stream total tips
          await tx.liveStream.update({
            where: { id: streamId },
            data: { totalTipsKr: { increment: data.amountKr } }
          });

          // Update viewer total tips
          await tx.liveViewer.updateMany({
            where: { streamId, userId: data.senderId },
            data: { totalTipsKr: { increment: data.amountKr } }
          });
        });

        // Broadcast tip
        io.to(`stream:${streamId}`).emit('tip:received', {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          recipientId: data.recipientId,
          amountKr: data.amountKr,
          message: data.message,
          giftType: data.giftType
        });

        console.log(`[LiveSocket] Tip sent: ${data.amountKr} Kr from ${data.senderId} to ${data.recipientId}`);
      } catch (error) {
        console.error('[LiveSocket] Error sending tip:', error);
        socket.emit('error', { message: 'Failed to send tip' });
      }
    });

    // Leave stream
    socket.on('viewer:leave', async (data: { streamId: string }) => {
      await handleViewerLeave(socket, data.streamId);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const streamId = socket.data.streamId;
      if (streamId) {
        await handleViewerLeave(socket, streamId);
      }
      console.log(`[LiveSocket] User disconnected: ${socket.data.userId}`);
    });
  });

  async function handleViewerLeave(socket: any, streamId: string) {
    try {
      // Update viewer count
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { viewerCount: { decrement: 1 } }
      });

      // Update viewer record
      await prisma.liveViewer.updateMany({
        where: {
          streamId,
          userId: socket.data.userId
        },
        data: {
          leftAt: new Date()
        }
      });

      // Get updated viewer count
      const stream = await prisma.liveStream.findUnique({
        where: { id: streamId },
        select: { viewerCount: true }
      });

      // Broadcast viewer left
      io.to(`stream:${streamId}`).emit('viewer:left', {
        viewerCount: stream?.viewerCount || 0,
        userId: socket.data.userId,
        username: socket.data.username,
        action: 'left'
      });

      socket.leave(`stream:${streamId}`);
      console.log(`[LiveSocket] User ${socket.data.userId} left stream ${streamId}`);
    } catch (error) {
      console.error('[LiveSocket] Error leaving stream:', error);
    }
  }

  return io;
}
