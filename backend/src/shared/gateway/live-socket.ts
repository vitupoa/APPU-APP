import { Server as SocketServer, Socket } from 'socket.io';
import { LiveService } from '../../modules/live/live.service.js';

/**
 * Initializes the Live Streaming Socket.io namespace.
 * Handles real-time: join/leave, chat, tips, likes, battles, co-hosting.
 */
export function initializeLiveSocket(io: SocketServer) {
  io.on('connection', (socket: Socket) => {

    // ─── JOIN LIVE ROOM ─────────────────────────────────
    socket.on('live:join', async (data: { streamId: string; userId: string }) => {
      try {
        const { streamId, userId } = data;
        socket.join(`live:${streamId}`);

        const result = await LiveService.joinStream(streamId, userId);

        // Notify all viewers in room
        io.to(`live:${streamId}`).emit('live:viewer_joined', {
          streamId,
          viewerCount: result.viewerCount,
          user: result.user,
        });
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── LEAVE LIVE ROOM ────────────────────────────────
    socket.on('live:leave', async (data: { streamId: string; userId: string }) => {
      try {
        const { streamId, userId } = data;
        socket.leave(`live:${streamId}`);

        await LiveService.leaveStream(streamId, userId);

        io.to(`live:${streamId}`).emit('live:viewer_left', {
          streamId,
          userId,
        });
      } catch {
        // Non-critical
      }
    });

    // ─── CHAT MESSAGE ───────────────────────────────────
    socket.on('live:message', async (data: { streamId: string; userId: string; text: string }) => {
      try {
        const { streamId, userId, text } = data;
        const message = await LiveService.sendMessage(streamId, userId, text);

        io.to(`live:${streamId}`).emit('live:new_message', message);
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── TIP / GIFT ─────────────────────────────────────
    socket.on('live:tip', async (data: {
      streamId: string;
      userId: string;
      recipientId: string;
      amountKr: number;
      giftType?: string;
      message?: string;
      currency?: string;
    }) => {
      try {
        const result = await LiveService.sendTip(
          data.streamId, data.userId, data.recipientId,
          data.amountKr, data.giftType, data.message, data.currency || 'USD'
        );

        // Broadcast tip to entire room (triggers animation)
        io.to(`live:${data.streamId}`).emit('live:tip_received', {
          streamId: data.streamId,
          senderId: data.userId,
          recipientId: data.recipientId,
          amountKr: data.amountKr,
          giftType: data.giftType,
          message: data.message,
          sender: result.sender,
        });

        // Update leaderboard
        const leaderboard = await LiveService.getLeaderboard(data.streamId);
        io.to(`live:${data.streamId}`).emit('live:leaderboard_update', leaderboard);

        // Update gift goal if active
        const stream = await LiveService.getStream(data.streamId);
        if (stream.giftGoalTarget) {
          io.to(`live:${data.streamId}`).emit('live:gift_goal_update', {
            title: stream.giftGoalTitle,
            target: stream.giftGoalTarget,
            current: stream.giftGoalCurrent,
          });
        }

        // Notify recipient wallet update
        io.to(`user:${data.recipientId}`).emit('wallet_updated', {
          balance: result.krReceived,
        });
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── LIKES (TAP-TO-LIKE) ────────────────────────────
    socket.on('live:like', async (data: { streamId: string; userId: string; count?: number }) => {
      try {
        const result = await LiveService.sendLikes(data.streamId, data.userId, data.count || 1);

        io.to(`live:${data.streamId}`).emit('live:like_burst', {
          streamId: data.streamId,
          userId: data.userId,
          count: result.count,
        });
      } catch {
        // Non-critical
      }
    });

    // ─── PIN PRODUCT ────────────────────────────────────
    socket.on('live:pin_product', async (data: {
      streamId: string; userId: string; productId: string; salePrice?: number;
    }) => {
      try {
        const result = await LiveService.pinProduct(
          data.streamId, data.userId, data.productId, data.salePrice
        );

        io.to(`live:${data.streamId}`).emit('live:product_pinned', result);
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── BATTLE ACCEPT ──────────────────────────────────
    socket.on('live:battle_accept', async (data: { battleId: string; userId: string }) => {
      try {
        const battle = await LiveService.acceptBattle(data.battleId, data.userId);

        // Notify both streams
        io.to(`live:${battle.streamId}`).emit('live:battle_started', battle);
        io.to(`live:${battle.opponentStreamId}`).emit('live:battle_started', battle);

        // Auto-end battle after duration
        setTimeout(async () => {
          try {
            const ended = await LiveService.endBattle(data.battleId);
            io.to(`live:${ended.streamId}`).emit('live:battle_ended', ended);
            io.to(`live:${ended.opponentStreamId}`).emit('live:battle_ended', ended);
          } catch {
            // Battle may already be ended
          }
        }, battle.durationSecs * 1000);
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── STREAM ENDED ───────────────────────────────────
    socket.on('live:end_stream', async (data: { streamId: string; userId: string }) => {
      try {
        await LiveService.endStream(data.streamId, data.userId);

        io.to(`live:${data.streamId}`).emit('live:stream_ended', {
          streamId: data.streamId,
        });
      } catch (error: any) {
        socket.emit('live:error', { message: error.message });
      }
    });

    // ─── CO-HOST JOINED ─────────────────────────────────
    socket.on('live:co_host_join', async (data: { streamId: string; userId: string }) => {
      try {
        socket.join(`live:${data.streamId}`);
        io.to(`live:${data.streamId}`).emit('live:co_host_joined', {
          streamId: data.streamId,
          userId: data.userId,
        });
      } catch {
        // Non-critical
      }
    });

    // ─── WEBRTC SIGNALING FOR LIVE (Co-host / Duet) ─────
    socket.on('live:offer', (data: { streamId: string; targetUserId: string; sdp: any }) => {
      io.to(`user:${data.targetUserId}`).emit('live:offer', {
        streamId: data.streamId,
        sdp: data.sdp,
        fromSocketId: socket.id,
      });
    });

    socket.on('live:answer', (data: { streamId: string; targetUserId: string; sdp: any }) => {
      io.to(`user:${data.targetUserId}`).emit('live:answer', {
        streamId: data.streamId,
        sdp: data.sdp,
        fromSocketId: socket.id,
      });
    });

    socket.on('live:ice_candidate', (data: { streamId: string; targetUserId: string; candidate: any }) => {
      io.to(`user:${data.targetUserId}`).emit('live:ice_candidate', {
        streamId: data.streamId,
        candidate: data.candidate,
        fromSocketId: socket.id,
      });
    });
  });
}
