# WebSocket Stability Validation Guide

## Overview
This document provides comprehensive testing procedures for validating WebSocket stability, reconnection logic, and real-time event delivery in the Krieta platform.

## Architecture

### Backend (Node.js + Socket.io)
- **Location**: `backend/src/shared/gateway/socket.ts`
- **Redis Adapter**: Horizontal scaling support
- **Events**: `notification_received`, `milestone_completed`, `wallet_updated`, `vote_update`, `contest_update`, `like_update`

### Mobile (Kotlin Multiplatform)
- **Location**: `composeApp/src/commonMain/kotlin/com/krieta/com/core/network/WebSocketService.kt`
- **Features**:
  - Exponential backoff reconnection (1s → 30s max)
  - Heartbeat monitoring (30s interval, 60s timeout)
  - Connection state tracking
  - Automatic authentication on connect
  - Event-based message routing

## Connection States

```kotlin
enum class WebSocketConnectionState {
    DISCONNECTED,  // Not connected
    CONNECTING,    // Initial connection attempt
    CONNECTED,     // Successfully connected and authenticated
    RECONNECTING,  // Attempting to reconnect after failure
    ERROR          // Connection error occurred
}
```

## Testing Procedures

### 1. Basic Connection Test

**Objective**: Verify initial connection and authentication

**Steps**:
1. Start backend server: `cd backend && npm run dev`
2. Launch mobile app
3. Login with valid credentials
4. Observe logs for WebSocket connection

**Expected Logs**:
```
[WebSocket] Connecting to: ws://10.0.2.2:3000/socket.io/?EIO=4&transport=websocket (attempt 1)
[WebSocket] Authentication message sent
[WebSocket] Connection established (Socket.io handshake)
[WebSocket] Authentication successful
```

**Success Criteria**:
- Connection state changes: DISCONNECTED → CONNECTING → CONNECTED
- No error messages in logs
- Backend logs show client connection

---

### 2. Reconnection Test (Network Interruption)

**Objective**: Validate automatic reconnection after network loss

**Steps**:
1. Establish WebSocket connection
2. Disable network (Airplane mode or WiFi off)
3. Wait 5 seconds
4. Re-enable network
5. Observe reconnection behavior

**Expected Behavior**:
- Connection state changes to ERROR
- Automatic reconnection attempts start
- Exponential backoff delays: 1s, 2s, 4s, 8s, 16s, 30s (max)
- Successfully reconnects when network restored
- State returns to CONNECTED

**Expected Logs**:
```
[WebSocket] Connection error (attempt 1): Connection refused
[WebSocket] Reconnecting in 1234ms...
[WebSocket] Connecting to: ws://... (attempt 2)
[WebSocket] Connection established
```

**Success Criteria**:
- Reconnects within 30 seconds of network restoration
- No manual intervention required
- All event subscriptions remain active

---

### 3. Heartbeat Validation Test

**Objective**: Verify heartbeat mechanism detects stale connections

**Steps**:
1. Establish connection
2. Monitor logs for heartbeat activity
3. Simulate stale connection (backend pause or network delay)
4. Verify automatic reconnection

**Expected Logs**:
```
[WebSocket] Received pong
[WebSocket] No messages received for 60s, connection may be stale
[WebSocket] Reconnecting...
```

**Success Criteria**:
- Ping sent every 30 seconds
- Stale connection detected after 60 seconds of no messages
- Automatic reconnection triggered

---

### 4. Event Delivery Test

**Objective**: Validate real-time event reception and routing

**Test Cases**:

#### A. Vote Update Event
1. User A votes on contest submission
2. User B (viewing same submission) receives update

**Backend Trigger**:
```typescript
// In contests.service.ts after vote
io.to(`submission:${submissionId}`).emit('vote_update', {
  submissionId,
  votes: newVoteCount,
  userId: voterId
});
```

**Expected Mobile Log**:
```
[WebSocket] Received event: vote_update
```

#### B. Wallet Update Event
1. User receives tip or completes transaction
2. Wallet balance updates in real-time

**Backend Trigger**:
```typescript
io.to(`user:${userId}`).emit('wallet_updated', {
  userId,
  newBalance: wallet.krBalance
});
```

#### C. Contest Update Event
1. Contest status changes (ACTIVE → JUDGING)
2. All participants receive notification

**Backend Trigger**:
```typescript
io.emit('contest_update', {
  contestId,
  status: 'JUDGING',
  participantsCount
});
```

**Success Criteria**:
- Events received within 500ms of emission
- Correct event routing to appropriate flows
- No message loss during normal operation

---

### 5. Stress Test (Multiple Reconnections)

**Objective**: Validate stability under repeated connection failures

**Steps**:
1. Establish connection
2. Toggle network on/off 10 times rapidly
3. Observe reconnection behavior
4. Verify final stable connection

**Expected Behavior**:
- Max 10 reconnection attempts before stopping
- Exponential backoff prevents connection spam
- Final connection is stable

**Success Criteria**:
- No crashes or memory leaks
- Connection eventually stabilizes
- All event flows remain functional

---

### 6. Authentication Failure Test

**Objective**: Handle expired or invalid tokens gracefully

**Steps**:
1. Manually expire access token
2. Attempt WebSocket connection
3. Observe error handling

**Expected Logs**:
```
[WebSocket] No access token available, waiting...
[WebSocket] Connection error: Unauthorized Socket Binding
```

**Success Criteria**:
- Connection state changes to ERROR
- No infinite retry loop
- Waits for valid token before retrying

---

### 7. Concurrent Event Test

**Objective**: Validate handling of multiple simultaneous events

**Steps**:
1. Trigger multiple events simultaneously:
   - Vote on submission
   - Receive tip
   - Complete milestone
2. Verify all events are received and processed

**Success Criteria**:
- All events received in correct order
- No event loss or duplication
- UI updates reflect all changes

---

### 8. Long-Running Connection Test

**Objective**: Validate stability over extended periods

**Steps**:
1. Establish connection
2. Leave app running for 1 hour
3. Monitor connection state and heartbeat
4. Trigger events periodically

**Expected Behavior**:
- Connection remains stable
- Heartbeat continues every 30 seconds
- Events delivered consistently

**Success Criteria**:
- No unexpected disconnections
- Memory usage remains stable
- All events delivered successfully

---

## Connection Metrics API

Use the `getConnectionMetrics()` method to monitor connection health:

```kotlin
val metrics = webSocketService.getConnectionMetrics()
println(metrics)
```

**Output**:
```kotlin
{
  "state": "CONNECTED",
  "reconnectAttempts": 0,
  "lastSuccessfulConnection": 1705334400000,
  "lastMessageReceived": 1705334430000,
  "timeSinceLastMessage": 5000,
  "isConnected": true
}
```

---

## Manual Testing Commands

### Backend Event Emission (for testing)

Add temporary test endpoint in `backend/src/index.ts`:

```typescript
app.post('/test/emit-event', (req, res) => {
  const { event, data } = req.body;
  io.emit(event, data);
  res.json({ success: true });
});
```

**Test with curl**:
```bash
# Test vote update
curl -X POST http://localhost:3000/test/emit-event \
  -H "Content-Type: application/json" \
  -d '{"event":"vote_update","data":{"submissionId":"123","votes":150}}'

# Test wallet update
curl -X POST http://localhost:3000/test/emit-event \
  -H "Content-Type: application/json" \
  -d '{"event":"wallet_updated","data":{"userId":"user123","newBalance":"1000.50"}}'
```

---

## Troubleshooting

### Issue: Connection never establishes
**Possible Causes**:
- Backend not running
- Incorrect BASE_URL in ApiConstants
- Firewall blocking WebSocket connections

**Solution**:
- Verify backend is running: `curl http://localhost:3000/health`
- Check BASE_URL matches backend address
- Test WebSocket endpoint: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

### Issue: Frequent disconnections
**Possible Causes**:
- Network instability
- Backend crashes
- Redis connection issues

**Solution**:
- Check backend logs for errors
- Verify Redis is running: `redis-cli ping`
- Monitor network quality

### Issue: Events not received
**Possible Causes**:
- Not authenticated
- Wrong room/channel
- Event name mismatch

**Solution**:
- Verify authentication message sent
- Check backend event emission code
- Ensure event names match exactly

---

## Performance Benchmarks

### Target Metrics
- **Connection Time**: < 2 seconds
- **Reconnection Time**: < 5 seconds
- **Event Latency**: < 500ms
- **Heartbeat Interval**: 30 seconds
- **Stale Detection**: 60 seconds
- **Max Reconnect Attempts**: 10
- **Max Backoff Delay**: 30 seconds

### Monitoring
- Connection state changes
- Reconnection attempts
- Event delivery time
- Memory usage over time
- Network bandwidth usage

---

## Validation Checklist

- [ ] Initial connection succeeds
- [ ] Authentication completes
- [ ] Heartbeat pings sent every 30s
- [ ] Reconnects after network loss
- [ ] Exponential backoff works correctly
- [ ] Max reconnect attempts enforced
- [ ] Stale connections detected
- [ ] All event types received
- [ ] Event routing works correctly
- [ ] No memory leaks over 1 hour
- [ ] Handles invalid tokens gracefully
- [ ] Concurrent events processed correctly
- [ ] Connection metrics accurate
- [ ] Force reconnect works
- [ ] Clean disconnect on logout

---

## Conclusion

The WebSocket implementation includes:
- ✅ Automatic reconnection with exponential backoff
- ✅ Heartbeat monitoring for stale connection detection
- ✅ Connection state tracking
- ✅ Event-based message routing
- ✅ Error handling and logging
- ✅ Connection quality metrics
- ✅ Force reconnect capability

All features have been implemented and are ready for validation testing.
