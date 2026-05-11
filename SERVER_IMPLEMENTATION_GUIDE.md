# Server-Side Implementation Guide

This guide shows you how to implement the server-side requirements for secure financial transactions.

---

## 📋 Requirements Checklist

### Server-Side Implementation
- [ ] Generate unique session secrets per user
- [ ] Rotate secrets periodically (24-48 hours)
- [ ] Verify ALL transaction signatures
- [ ] Check nonce uniqueness (prevent replay)
- [ ] Validate timestamps (max 5 minutes old)
- [ ] Verify user balance before transaction
- [ ] Use database transactions (atomicity)
- [ ] Log all financial transactions
- [ ] Rate limit financial endpoints
- [ ] Monitor for suspicious patterns

---

## 🗄️ Database Schema

### 1. Session Secrets Table

```sql
CREATE TABLE user_session_secrets (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    secret BYTEA NOT NULL,  -- 256-bit secret
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    device_id VARCHAR(255),
    
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_expires (expires_at)
);
```

### 2. Nonce Tracking Table

```sql
CREATE TABLE transaction_nonces (
    id BIGSERIAL PRIMARY KEY,
    nonce VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,  -- TIP, WITHDRAW, TOPUP
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_nonce (nonce),
    INDEX idx_expires (expires_at)
);
```

### 3. Financial Transactions Log

```sql
CREATE TABLE financial_transactions_log (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount_kr DECIMAL(20, 2) NOT NULL,
    amount_fiat DECIMAL(20, 2),
    currency VARCHAR(10),
    provider VARCHAR(50),
    counterparty_id VARCHAR(255),
    signature VARCHAR(500) NOT NULL,
    nonce VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,  -- PENDING, COMPLETED, FAILED
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    INDEX idx_user (user_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);
```

---

## 🔐 Step 1: Generate Session Secrets

### Node.js/Express Example

```javascript
const crypto = require('crypto');

// Generate session secret on login
async function generateSessionSecret(userId, deviceId) {
    // Generate cryptographically secure 256-bit secret
    const secret = crypto.randomBytes(32); // 32 bytes = 256 bits
    
    // Set expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Deactivate old secrets for this user
    await db.query(
        'UPDATE user_session_secrets SET is_active = FALSE WHERE user_id = $1',
        [userId]
    );
    
    // Store new secret
    await db.query(
        `INSERT INTO user_session_secrets 
         (user_id, secret, expires_at, device_id) 
         VALUES ($1, $2, $3, $4)`,
        [userId, secret, expiresAt, deviceId]
    );
    
    // Return base64-encoded secret
    return {
        sessionSecret: secret.toString('base64'),
        secretExpiresAt: expiresAt.getTime()
    };
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password, deviceId } = req.body;
    
    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateJWT(user);
    const refreshToken = generateRefreshToken(user);
    
    // Generate session secret
    const { sessionSecret, secretExpiresAt } = await generateSessionSecret(
        user.id,
        deviceId
    );
    
    res.json({
        user,
        accessToken,
        refreshToken,
        sessionSecret,
        secretExpiresAt
    });
});
```

### Python/FastAPI Example

```python
import secrets
import base64
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException

app = FastAPI()

async def generate_session_secret(user_id: str, device_id: str):
    # Generate cryptographically secure 256-bit secret
    secret = secrets.token_bytes(32)  # 32 bytes = 256 bits
    
    # Set expiration (24 hours)
    expires_at = datetime.now() + timedelta(hours=24)
    
    # Deactivate old secrets
    await db.execute(
        "UPDATE user_session_secrets SET is_active = FALSE WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    # Store new secret
    await db.execute(
        """INSERT INTO user_session_secrets 
           (user_id, secret, expires_at, device_id) 
           VALUES (:user_id, :secret, :expires_at, :device_id)""",
        {
            "user_id": user_id,
            "secret": secret,
            "expires_at": expires_at,
            "device_id": device_id
        }
    )
    
    return {
        "sessionSecret": base64.b64encode(secret).decode('utf-8'),
        "secretExpiresAt": int(expires_at.timestamp() * 1000)
    }

@app.post("/api/auth/login")
async def login(email: str, password: str, device_id: str):
    # Authenticate user
    user = await authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate tokens
    access_token = generate_jwt(user)
    refresh_token = generate_refresh_token(user)
    
    # Generate session secret
    session_data = await generate_session_secret(user.id, device_id)
    
    return {
        "user": user,
        "accessToken": access_token,
        "refreshToken": refresh_token,
        **session_data
    }
```

---

## 🔏 Step 2: Verify Transaction Signatures

### Node.js Example

```javascript
const crypto = require('crypto');

// Retrieve user's session secret
async function getUserSessionSecret(userId) {
    const result = await db.query(
        `SELECT secret, expires_at 
         FROM user_session_secrets 
         WHERE user_id = $1 AND is_active = TRUE 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
    );
    
    if (!result.rows.length) {
        return null;
    }
    
    const { secret, expires_at } = result.rows[0];
    
    // Check if expired
    if (new Date(expires_at) < new Date()) {
        return null;
    }
    
    return secret;
}

// Verify HMAC-SHA256 signature
function verifySignature(message, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    const expectedSignature = hmac.digest('base64');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Verify tip signature
async function verifyTipSignature(req) {
    const { senderId, recipientId, krAmount, nonce, timestamp, signature } = req.body;
    
    // Get user's session secret
    const secret = await getUserSessionSecret(senderId);
    if (!secret) {
        throw new Error('Session expired or invalid');
    }
    
    // Reconstruct canonical string (must match client)
    const canonical = `TIP|senderId=${senderId}&recipientId=${recipientId}&krAmount=${krAmount}&nonce=${nonce}&timestamp=${timestamp}`;
    
    // Verify signature
    return verifySignature(canonical, signature, secret);
}
```

### Python Example

```python
import hmac
import hashlib
import base64
from datetime import datetime

async def get_user_session_secret(user_id: str) -> bytes:
    result = await db.fetch_one(
        """SELECT secret, expires_at 
           FROM user_session_secrets 
           WHERE user_id = :user_id AND is_active = TRUE 
           ORDER BY created_at DESC 
           LIMIT 1""",
        {"user_id": user_id}
    )
    
    if not result:
        return None
    
    # Check if expired
    if result['expires_at'] < datetime.now():
        return None
    
    return result['secret']

def verify_signature(message: str, signature: str, secret: bytes) -> bool:
    # Generate expected signature
    expected = hmac.new(
        secret,
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    expected_b64 = base64.b64encode(expected).decode('utf-8')
    
    # Constant-time comparison
    return hmac.compare_digest(signature, expected_b64)

async def verify_tip_signature(request_data: dict) -> bool:
    sender_id = request_data['senderId']
    recipient_id = request_data['recipientId']
    kr_amount = request_data['krAmount']
    nonce = request_data['nonce']
    timestamp = request_data['timestamp']
    signature = request_data['signature']
    
    # Get user's session secret
    secret = await get_user_session_secret(sender_id)
    if not secret:
        raise ValueError('Session expired or invalid')
    
    # Reconstruct canonical string (must match client)
    canonical = f"TIP|senderId={sender_id}&recipientId={recipient_id}&krAmount={kr_amount}&nonce={nonce}&timestamp={timestamp}"
    
    # Verify signature
    return verify_signature(canonical, signature, secret)
```

---

## 🔄 Step 3: Prevent Replay Attacks

### Node.js Example

```javascript
// Check if nonce already used
async function isNonceUsed(nonce) {
    const result = await db.query(
        'SELECT 1 FROM transaction_nonces WHERE nonce = $1',
        [nonce]
    );
    return result.rows.length > 0;
}

// Store nonce
async function storeNonce(nonce, userId, transactionType, timestamp) {
    // Nonces expire after 10 minutes
    const expiresAt = new Date(timestamp + 10 * 60 * 1000);
    
    await db.query(
        `INSERT INTO transaction_nonces 
         (nonce, user_id, transaction_type, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [nonce, userId, transactionType, expiresAt]
    );
}

// Validate timestamp (max 5 minutes old)
function isTimestampValid(timestamp) {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return (now - timestamp) <= maxAge && timestamp <= now;
}

// Clean up expired nonces (run periodically)
async function cleanupExpiredNonces() {
    await db.query(
        'DELETE FROM transaction_nonces WHERE expires_at < NOW()'
    );
}

// Set up cleanup job (every hour)
setInterval(cleanupExpiredNonces, 60 * 60 * 1000);
```

### Python Example

```python
from datetime import datetime, timedelta

async def is_nonce_used(nonce: str) -> bool:
    result = await db.fetch_one(
        "SELECT 1 FROM transaction_nonces WHERE nonce = :nonce",
        {"nonce": nonce}
    )
    return result is not None

async def store_nonce(nonce: str, user_id: str, transaction_type: str, timestamp: int):
    # Nonces expire after 10 minutes
    expires_at = datetime.fromtimestamp(timestamp / 1000) + timedelta(minutes=10)
    
    await db.execute(
        """INSERT INTO transaction_nonces 
           (nonce, user_id, transaction_type, expires_at) 
           VALUES (:nonce, :user_id, :transaction_type, :expires_at)""",
        {
            "nonce": nonce,
            "user_id": user_id,
            "transaction_type": transaction_type,
            "expires_at": expires_at
        }
    )

def is_timestamp_valid(timestamp: int) -> bool:
    now = int(datetime.now().timestamp() * 1000)
    max_age = 5 * 60 * 1000  # 5 minutes
    
    return (now - timestamp) <= max_age and timestamp <= now

async def cleanup_expired_nonces():
    await db.execute(
        "DELETE FROM transaction_nonces WHERE expires_at < NOW()"
    )

# Set up cleanup job (using APScheduler or similar)
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(cleanup_expired_nonces, 'interval', hours=1)
scheduler.start()
```

---

## 💰 Step 4: Process Tip Transaction

### Complete Node.js Example

```javascript
app.post('/api/wallet/tip', authenticateJWT, async (req, res) => {
    const { recipientId, krAmount, currency, signature, nonce, timestamp } = req.body;
    const senderId = req.user.id;  // From JWT
    
    try {
        // 1. Verify signature
        const isValidSignature = await verifyTipSignature({
            senderId,
            recipientId,
            krAmount,
            nonce,
            timestamp,
            signature
        });
        
        if (!isValidSignature) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // 2. Check nonce uniqueness
        if (await isNonceUsed(nonce)) {
            return res.status(400).json({ error: 'Duplicate request' });
        }
        
        // 3. Validate timestamp
        if (!isTimestampValid(timestamp)) {
            return res.status(400).json({ error: 'Request expired' });
        }
        
        // 4. Validate amount
        if (krAmount < 1 || krAmount > 10000) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        // 5. Check sender balance
        const senderBalance = await getUserBalance(senderId);
        if (senderBalance < krAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // 6. Process transaction atomically
        const transactionId = generateTransactionId();
        
        await db.transaction(async (trx) => {
            // Deduct from sender
            await trx.query(
                'UPDATE user_wallets SET kr_balance = kr_balance - $1 WHERE user_id = $2',
                [krAmount, senderId]
            );
            
            // Add to recipient
            await trx.query(
                'UPDATE user_wallets SET kr_balance = kr_balance + $1 WHERE user_id = $2',
                [krAmount, recipientId]
            );
            
            // Record transaction
            await trx.query(
                `INSERT INTO transactions 
                 (id, user_id, type, amount_kr, currency, counterparty_id, status) 
                 VALUES ($1, $2, 'TIP', $3, $4, $5, 'COMPLETED')`,
                [transactionId, senderId, krAmount, currency, recipientId]
            );
            
            // Store nonce
            await storeNonce(nonce, senderId, 'TIP', timestamp);
            
            // Log transaction
            await logFinancialTransaction({
                transactionId,
                userId: senderId,
                transactionType: 'TIP',
                amountKr: krAmount,
                currency,
                counterpartyId: recipientId,
                signature,
                nonce,
                timestamp,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                deviceId: req.headers['x-device-id'],
                status: 'COMPLETED'
            });
        });
        
        res.json({
            success: true,
            transactionId,
            krTipped: krAmount
        });
        
    } catch (error) {
        console.error('Tip failed:', error);
        
        // Log failed attempt
        await logFinancialTransaction({
            userId: senderId,
            transactionType: 'TIP',
            amountKr: krAmount,
            status: 'FAILED',
            errorMessage: error.message,
            signature,
            nonce,
            timestamp
        });
        
        res.status(500).json({ error: 'Transaction failed' });
    }
});
```

### Complete Python Example

```python
@app.post("/api/wallet/tip")
async def send_tip(
    request: Request,
    recipient_id: str,
    kr_amount: int,
    currency: str,
    signature: str,
    nonce: str,
    timestamp: int,
    current_user: User = Depends(get_current_user)
):
    sender_id = current_user.id
    
    try:
        # 1. Verify signature
        is_valid = await verify_tip_signature({
            'senderId': sender_id,
            'recipientId': recipient_id,
            'krAmount': kr_amount,
            'nonce': nonce,
            'timestamp': timestamp,
            'signature': signature
        })
        
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # 2. Check nonce uniqueness
        if await is_nonce_used(nonce):
            raise HTTPException(status_code=400, detail="Duplicate request")
        
        # 3. Validate timestamp
        if not is_timestamp_valid(timestamp):
            raise HTTPException(status_code=400, detail="Request expired")
        
        # 4. Validate amount
        if kr_amount < 1 or kr_amount > 10000:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        # 5. Check sender balance
        sender_balance = await get_user_balance(sender_id)
        if sender_balance < kr_amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # 6. Process transaction atomically
        transaction_id = generate_transaction_id()
        
        async with db.transaction():
            # Deduct from sender
            await db.execute(
                "UPDATE user_wallets SET kr_balance = kr_balance - :amount WHERE user_id = :user_id",
                {"amount": kr_amount, "user_id": sender_id}
            )
            
            # Add to recipient
            await db.execute(
                "UPDATE user_wallets SET kr_balance = kr_balance + :amount WHERE user_id = :user_id",
                {"amount": kr_amount, "user_id": recipient_id}
            )
            
            # Record transaction
            await db.execute(
                """INSERT INTO transactions 
                   (id, user_id, type, amount_kr, currency, counterparty_id, status) 
                   VALUES (:id, :user_id, 'TIP', :amount, :currency, :counterparty, 'COMPLETED')""",
                {
                    "id": transaction_id,
                    "user_id": sender_id,
                    "amount": kr_amount,
                    "currency": currency,
                    "counterparty": recipient_id
                }
            )
            
            # Store nonce
            await store_nonce(nonce, sender_id, 'TIP', timestamp)
            
            # Log transaction
            await log_financial_transaction(
                transaction_id=transaction_id,
                user_id=sender_id,
                transaction_type='TIP',
                amount_kr=kr_amount,
                currency=currency,
                counterparty_id=recipient_id,
                signature=signature,
                nonce=nonce,
                timestamp=timestamp,
                ip_address=request.client.host,
                user_agent=request.headers.get('user-agent'),
                device_id=request.headers.get('x-device-id'),
                status='COMPLETED'
            )
        
        return {
            "success": True,
            "transactionId": transaction_id,
            "krTipped": kr_amount
        }
        
    except Exception as e:
        # Log failed attempt
        await log_financial_transaction(
            user_id=sender_id,
            transaction_type='TIP',
            amount_kr=kr_amount,
            status='FAILED',
            error_message=str(e),
            signature=signature,
            nonce=nonce,
            timestamp=timestamp
        )
        
        raise HTTPException(status_code=500, detail="Transaction failed")
```

---

## 🚦 Step 5: Rate Limiting

### Node.js with Redis Example

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function checkRateLimit(userId, action, maxAttempts, windowSeconds) {
    const key = `ratelimit:${action}:${userId}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }
    
    if (current > maxAttempts) {
        const ttl = await redis.ttl(key);
        throw new Error(`Rate limit exceeded. Try again in ${ttl} seconds`);
    }
    
    return current;
}

// Apply to tip endpoint
app.post('/api/wallet/tip', authenticateJWT, async (req, res) => {
    try {
        // Rate limit: 10 tips per minute
        await checkRateLimit(req.user.id, 'tip', 10, 60);
        
        // ... rest of tip logic
    } catch (error) {
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ error: error.message });
        }
        throw error;
    }
});
```

---

## 📊 Step 6: Monitoring & Alerts

### Suspicious Pattern Detection

```javascript
async function detectSuspiciousActivity(userId) {
    // Check for rapid transactions
    const recentTransactions = await db.query(
        `SELECT COUNT(*) as count 
         FROM financial_transactions_log 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '5 minutes'`,
        [userId]
    );
    
    if (recentTransactions.rows[0].count > 20) {
        await alertSecurityTeam({
            type: 'RAPID_TRANSACTIONS',
            userId,
            count: recentTransactions.rows[0].count
        });
    }
    
    // Check for large amounts
    const largeTransactions = await db.query(
        `SELECT SUM(amount_kr) as total 
         FROM financial_transactions_log 
         WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [userId]
    );
    
    if (largeTransactions.rows[0].total > 50000) {
        await alertSecurityTeam({
            type: 'LARGE_AMOUNT',
            userId,
            total: largeTransactions.rows[0].total
        });
    }
}
```

---

## ✅ Testing Your Implementation

### Test Checklist

```bash
# 1. Test session secret generation
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","deviceId":"test-device"}'

# Should return: sessionSecret and secretExpiresAt

# 2. Test signature verification
# (Use client to generate valid signature)

# 3. Test nonce replay prevention
# Send same request twice - second should fail

# 4. Test timestamp validation
# Send request with old timestamp - should fail

# 5. Test rate limiting
# Send 11 tips in 1 minute - 11th should fail

# 6. Test balance check
# Try to tip more than balance - should fail

# 7. Test expired session
# Wait for session to expire, try transaction - should fail
```

---

## 🎯 Deployment Checklist

- [ ] Database tables created
- [ ] Session secret generation implemented
- [ ] Signature verification implemented
- [ ] Nonce tracking implemented
- [ ] Timestamp validation implemented
- [ ] Balance checks implemented
- [ ] Atomic transactions implemented
- [ ] Transaction logging implemented
- [ ] Rate limiting implemented
- [ ] Monitoring & alerts set up
- [ ] Cleanup jobs scheduled
- [ ] Load tested
- [ ] Security audited

---

## 📞 Support

If you need help:
1. Review this guide thoroughly
2. Check client-side documentation
3. Test with small amounts first
4. Monitor logs for errors
5. Set up alerts for suspicious activity

**Your server is now ready for secure financial transactions!** 🔒
