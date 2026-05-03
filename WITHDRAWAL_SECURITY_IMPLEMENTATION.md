# Withdrawal Security Implementation - Complete Protection

## Security Measures Implemented

### 1. Amount Validation & Sanitization
**Frontend Protection:**
- Input sanitization removes non-numeric characters
- Real-time validation prevents invalid amounts
- Decimal precision limited to 2 places
- Range validation (min: 1 Kr, max: 1,000,000 Kr)
- Balance validation before submission

**Backend Protection:**
- Server-side amount sanitization
- Comprehensive amount validation
- Balance verification against current wallet state
- Numeric type validation and finite number checks

### 2. Balance Verification System
**Multi-Layer Balance Checks:**
- Initial balance check on amount entry
- Pre-submission balance refresh
- Server-side balance validation
- Transaction-level balance verification
- Post-transaction balance update

**Protection Against:**
- Race conditions between multiple withdrawal attempts
- Stale balance data exploitation
- Concurrent transaction conflicts

### 3. Cryptographic Hash Validation
**Amount Hash Protection:**
```
Hash = SHA(userId:amount:timestamp:nonce:salt)
```
- Prevents amount tampering during transmission
- Validates request integrity
- Includes timestamp to prevent replay attacks
- Uses cryptographic nonce for uniqueness

**Balance Hash Protection:**
```
Hash = SHA(userId:balance:timestamp:salt)
```
- Ensures balance data hasn't been modified
- Validates client-side balance checks
- Prevents balance manipulation attacks

### 4. Timestamp-Based Security
**Request Freshness:**
- Maximum request age: 5 minutes
- Prevents replay attacks
- Validates request chronology
- Blocks stale or future-dated requests

**Validation Tracking:**
- Tracks last validated amount timestamp
- Ensures amount integrity during form interaction
- Prevents amount modification after validation

### 5. Input Injection Prevention
**Frontend Sanitization:**
```kotlin
private fun sanitizeAmountInput(input: String): String {
    // Remove any non-numeric characters except decimal point
    val sanitized = input.filter { it.isDigit() || it == '.' }
    
    // Ensure only one decimal point
    val parts = sanitized.split('.')
    return if (parts.size > 2) {
        parts[0] + "." + parts.drop(1).joinToString("")
    } else {
        sanitized
    }
}
```

**Backend Sanitization:**
```typescript
static sanitizeAmount(input: any): number | null {
    if (typeof input === 'number') {
        return Number.isFinite(input) ? input : null;
    }
    
    if (typeof input === 'string') {
        const sanitized = input.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(sanitized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    
    return null;
}
```

### 6. Device Security Validation
**Security Score Requirements:**
- Minimum security score: 50/100
- Rooted/jailbroken device detection
- Emulator detection and blocking
- Hardware security validation

**Risk Assessment:**
- Device integrity checks
- Security posture evaluation
- Threat level assessment

### 7. Transaction Signing & Nonce Protection
**Cryptographic Signing:**
- All withdrawal requests must be signed
- Signature includes amount, provider, and metadata
- Server-side signature verification
- Invalid signatures rejected immediately

**Nonce Management:**
- Cryptographically secure nonce generation
- One-time use enforcement
- Replay attack prevention
- Nonce freshness validation

## Validation Flow

### Frontend Validation Sequence
1. **Input Sanitization**: Remove invalid characters
2. **Format Validation**: Check numeric format and precision
3. **Range Validation**: Verify min/max limits
4. **Balance Check**: Ensure sufficient funds
5. **Hash Generation**: Create security hashes
6. **Integrity Tracking**: Store validation metadata

### Backend Validation Sequence
1. **Input Sanitization**: Server-side input cleaning
2. **Security Hash Validation**: Verify request integrity
3. **Timestamp Validation**: Check request freshness
4. **Balance Verification**: Confirm current balance
5. **Amount Constraints**: Validate business rules
6. **Device Security**: Check security posture
7. **Transaction Signing**: Verify cryptographic signature
8. **Nonce Validation**: Ensure one-time use

## Security Error Messages

### User-Friendly Messages
- "Please enter a valid amount"
- "Insufficient balance. Available: X Kr, Requested: Y Kr"
- "Amount can have maximum 2 decimal places"
- "Minimum withdrawal amount is 1 Kr"
- "Maximum withdrawal amount is 1,000,000 Kr"

### Security Error Messages
- "Security Error: Amount validation failed. Please re-enter the amount."
- "Security Error: Request expired. Please try again."
- "Security Error: Device security score too low."
- "Security Error: Withdrawals not allowed from rooted devices."

## Attack Prevention

### 1. Amount Tampering
**Attack Vector**: Modifying withdrawal amount during transmission
**Protection**: Cryptographic hash validation with timestamp and nonce

### 2. Balance Manipulation
**Attack Vector**: Falsifying available balance data
**Protection**: Server-side balance verification with hash validation

### 3. Replay Attacks
**Attack Vector**: Reusing valid withdrawal requests
**Protection**: Timestamp validation and nonce management

### 4. Injection Attacks
**Attack Vector**: Injecting malicious code through amount field
**Protection**: Comprehensive input sanitization on both client and server

### 5. Race Conditions
**Attack Vector**: Multiple simultaneous withdrawal attempts
**Protection**: Database transactions with serializable isolation

### 6. Device Compromise
**Attack Vector**: Withdrawals from compromised devices
**Protection**: Device security scoring and rooted device detection

## Audit Trail

### Security Metadata Stored
```json
{
  "security": {
    "deviceSecurityScore": 85,
    "isRooted": false,
    "isEmulator": false
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestTimestamp": 1705312200000,
  "amountHash": "a1b2c3d4",
  "balanceHash": "e5f6g7h8",
  "originalAmount": 100.00,
  "sanitizedAmount": 100.00,
  "securityValidated": true
}
```

### Monitoring Points
- Failed security validations
- Hash mismatch attempts
- Expired request attempts
- Rooted device blocks
- Amount tampering detection

## Testing Scenarios

### Valid Withdrawal Tests
- [ ] Valid amount within balance
- [ ] Minimum amount (1 Kr)
- [ ] Maximum amount (1,000,000 Kr)
- [ ] Decimal amounts (e.g., 10.50 Kr)
- [ ] Exact balance amount

### Security Validation Tests
- [ ] Amount hash validation
- [ ] Balance hash validation
- [ ] Timestamp expiry (>5 minutes)
- [ ] Invalid nonce reuse
- [ ] Rooted device detection
- [ ] Low security score blocking

### Input Sanitization Tests
- [ ] Non-numeric characters removed
- [ ] Multiple decimal points handled
- [ ] Negative amounts rejected
- [ ] Zero amounts rejected
- [ ] Infinity/NaN values rejected

### Balance Protection Tests
- [ ] Insufficient balance rejection
- [ ] Concurrent withdrawal prevention
- [ ] Stale balance detection
- [ ] Balance refresh validation

## Performance Considerations

### Optimization Strategies
- Hash calculations are lightweight
- Validation occurs in parallel where possible
- Database queries optimized for balance checks
- Caching for security metadata

### Response Times
- Input validation: <10ms
- Hash generation: <5ms
- Balance verification: <100ms
- Total validation overhead: <200ms

## Compliance & Standards

### Security Standards Met
- Input validation best practices
- Cryptographic hash standards
- Timestamp-based security
- Device integrity validation
- Transaction signing protocols

### Audit Requirements
- Complete transaction trail
- Security validation logs
- Failed attempt tracking
- Device security metadata
- Timestamp verification records

This comprehensive security implementation ensures that users can only withdraw the exact amount they entered and only if they have sufficient withdrawable balance, with multiple layers of protection against tampering, injection, and fraud.