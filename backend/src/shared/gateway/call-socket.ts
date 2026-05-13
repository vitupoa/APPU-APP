import { Server as SocketServer, Socket } from 'socket.io';
import { CallService } from '../../modules/calls/calls.service.js';

/**
 * WebRTC signaling via Socket.io for voice/video calls.
 * Pure signaling relay — no media server needed.
 * Supports mesh topology for up to 8 participants.
 */
export function initializeCallSocket(io: SocketServer) {
  io.on('connection', (socket: Socket) => {

    // ─── CALL OFFER (WebRTC SDP) ────────────────────────
    socket.on('call:offer', (data: {
      callId: string;
      targetUserId: string;
      sdp: any;
      fromUserId: string;
    }) => {
      io.to(`user:${data.targetUserId}`).emit('call:offer', {
        callId: data.callId,
        sdp: data.sdp,
        fromUserId: data.fromUserId,
        fromSocketId: socket.id,
      });
    });

    // ─── CALL ANSWER (WebRTC SDP) ───────────────────────
    socket.on('call:answer', (data: {
      callId: string;
      targetUserId: string;
      sdp: any;
      fromUserId: string;
    }) => {
      io.to(`user:${data.targetUserId}`).emit('call:answer', {
        callId: data.callId,
        sdp: data.sdp,
        fromUserId: data.fromUserId,
        fromSocketId: socket.id,
      });
    });

    // ─── ICE CANDIDATE ─────────────────────────────────
    socket.on('call:ice_candidate', (data: {
      callId: string;
      targetUserId: string;
      candidate: any;
      fromUserId: string;
    }) => {
      io.to(`user:${data.targetUserId}`).emit('call:ice_candidate', {
        callId: data.callId,
        candidate: data.candidate,
        fromUserId: data.fromUserId,
        fromSocketId: socket.id,
      });
    });

    // ─── ANSWER CALL (join call room) ───────────────────
    socket.on('call:join', async (data: { callId: string; userId: string }) => {
      try {
        socket.join(`call:${data.callId}`);
        await CallService.answerCall(data.callId, data.userId);
      } catch (error: any) {
        socket.emit('call:error', { message: error.message });
      }
    });

    // ─── DECLINE CALL ───────────────────────────────────
    socket.on('call:decline', async (data: { callId: string; userId: string }) => {
      try {
        await CallService.declineCall(data.callId, data.userId);
      } catch (error: any) {
        socket.emit('call:error', { message: error.message });
      }
    });

    // ─── END CALL ───────────────────────────────────────
    socket.on('call:end', async (data: { callId: string; userId: string }) => {
      try {
        await CallService.endCall(data.callId, data.userId);
        socket.leave(`call:${data.callId}`);
      } catch (error: any) {
        socket.emit('call:error', { message: error.message });
      }
    });

    // ─── TOGGLE CAMERA / MIC ────────────────────────────
    socket.on('call:toggle_media', (data: {
      callId: string;
      userId: string;
      mediaType: 'video' | 'audio';
      enabled: boolean;
    }) => {
      // Broadcast to all participants in the call room
      socket.to(`call:${data.callId}`).emit('call:media_toggled', {
        user_id: data.userId,
        media_type: data.mediaType,
        enabled: data.enabled,
      });
    });
  });
}
