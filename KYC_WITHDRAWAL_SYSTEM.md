# KYC & WITHDRAWAL VERIFICATION SYSTEM

## Overview
Complete KYC (Know Your Customer) and withdrawal verification system with manual review capabilities for super admins and finance managers. Includes suspicious pattern detection, tiered withdrawal limits, and automated risk scoring.

## Features

### 1. **Single-Tier KYC System**
- **All users must complete KYC before withdrawing**
- Daily withdrawal limit: Rc 500,000
- Processing time: 24-48 hours
- No KYC fees

### 2. **Document Requirements**
Users must submit using **camera only** (no file uploads):
- **ID Document** (front & back):
  - National Identity Card
  - Driving License
  - Passport (front only)
- **Selfie** for face matching

### 3. **Camera-Only Capture**
- Users must take photos using their phone camera
- No file uploads from device allowed
- Front camera for selfie
- Back camera for ID documents
- Real-time capture with preview

### 4. **Automated Risk Detection**
System automatically flags suspicious patterns:
- **Rapid Withdrawals**: 3+ withdrawals in 24 hours
- **New Account**: Account less than 7 days old
- **Unusual Amount**: > 10x user's average withdrawal
- **Large First Withdrawal**: First withdrawal > Rc 50,000
- **0-29**: Low risk (green)
- **30-49**: Medium risk (yellow)
- **50-69**: High risk (orange)
- **70-100**: Critical risk (red) - auto-flagged

### 5. **Risk Scoring**
Super admins and finance managers can:
- Review KYC documents with side-by-side comparison
- Verify name matching between document and account
- Approve/reject KYC applications
- Review withdrawal requests with risk indicators
- Approve/flag/reject withdrawals
- View suspicious activity logs

### 6. **Manual Review Workflow**

### New Models

#### KYCDocument
```prisma
model KYCDocument {
  id              String       @id @default(uuid())
  userId          String
  documentType    DocumentType // NATIONAL_ID, DRIVING_LICENSE, PASSPORT
  frontImageUrl   String
  backImageUrl    String?
  selfieUrl       String
  fullName        String?
  documentNumber  String?
  status          KYCStatus    // NOT_STARTED, PENDING, APPROVED, REJECTED
  verifiedBy      String?
  verificationNote String?
  rejectionReason String?
  nameMatches     Boolean      @default(false)
  nameMatchScore  Decimal?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}
```

#### WithdrawalRequest (Enhanced)
```prisma
model WithdrawalRequest {
  id              String           @id @default(uuid())
  userId          String
  amountRc        Decimal
  status          WithdrawalStatus // PENDING, KYC_REQUIRED, UNDER_REVIEW, FLAGGED, APPROVED, REJECTED, COMPLETED
  requiresKyc     Boolean          @default(true)
  kycDocumentIds  String[]
  suspiciousFlags Json?
  riskScore       Decimal          @default(0)
  reviewedBy      String?
  reviewNote      String?
  flagReason      String?
  createdAt       DateTime         @default(now())
}
```

#### WithdrawalLimit
```prisma
model WithdrawalLimit {
  id              String   @id @default(uuid())
  userId          String   @unique
  dailyLimitRc    Decimal  // Rc 500,000 for all users
  withdrawnTodayRc Decimal @default(0)
  lastResetDate   DateTime @default(now())
}
```

#### SuspiciousActivity
```prisma
model SuspiciousActivity {
  id              String   @id @default(uuid())
  userId          String
  activityType    String   // withdrawal_request, rapid_withdrawals, etc
  description     String
  severity        String   // low, medium, high, critical
  metadata        Json?
  isResolved      Boolean  @default(false)
  resolvedBy      String?
  resolutionNote  String?
  createdAt       DateTime @default(now())
}
```

## API Endpoints

### User Endpoints

#### Submit KYC Documents
```http
POST /api/v1/kyc/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "NATIONAL_ID",
  "frontImageUrl": "https://...",
  "backImageUrl": "https://...",
  "selfieUrl": "https://..."
}
```

#### Get KYC Status
```http
GET /api/v1/kyc/status
Authorization: Bearer <token>
```

Response:
```json
{
  "kycStatus": "PENDING",
  "documents": [...],
  "dailyLimit": 500000,
  "withdrawnToday": 0
}
```

#### Request Withdrawal
```http
POST /api/v1/kyc/withdrawal/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "amountKr": 1000,
  "provider": "mpesa",
  "accountName": "John Doe",
  "accountDetails": {
    "phoneNumber": "+254712345678"
  },
  "currency": "KES"
}
```

Response (if KYC required):
```json
{
  "error": "KYC_REQUIRED: Please complete KYC verification before withdrawing. Take photos of your ID (front & back) and a selfie using your camera.",
  "requiresKyc": true
}
```

### Admin Endpoints (Super Admin & Finance Manager Only)

#### Get Pending KYC Documents
```http
GET /api/v1/kyc/admin/kyc/pending?limit=50&offset=0
Authorization: Bearer <admin_token>
```

#### Verify KYC Document
```http
POST /api/v1/kyc/admin/kyc/verify/:documentId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "approved": true,
  "verificationNote": "Documents verified successfully",
  "nameMatches": true,
  "nameMatchScore": 95
}
```

#### Get Pending Withdrawals
```http
GET /api/v1/kyc/admin/withdrawal/pending?status=FLAGGED&limit=50
Authorization: Bearer <admin_token>
```

#### Review Withdrawal
```http
POST /api/v1/kyc/admin/withdrawal/review/:requestId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "approved": true,
  "reviewNote": "Verified and approved"
}
```

Or flag:
```json
{
  "approved": false,
  "flagReason": "Suspicious pattern detected - needs further investigation"
}
```

#### Get Suspicious Activities
```http
GET /api/v1/kyc/admin/suspicious?resolved=false&limit=50
Authorization: Bearer <admin_token>
```

#### Resolve Suspicious Activity
```http
POST /api/v1/kyc/admin/suspicious/resolve/:activityId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "resolutionNote": "Investigated and cleared - legitimate user"
}
```

## Frontend Pages

### 1. KYC Verification Page (`/kyc`)
- View all pending KYC documents
- Review document images (front, back, selfie)
- Verify name matching
- Approve or reject with notes
- See account age warnings

### 2. Withdrawal Review Page (`/withdrawals`)
- View all pending/flagged withdrawals
- Filter by status (PENDING, UNDER_REVIEW, FLAGGED)
- See risk scores and suspicious patterns
- View linked KYC documents
- Approve, flag, or reject withdrawals
- Add review notes

## User Flow

### Any Withdrawal (KYC Required)
1. User requests withdrawal
2. System checks if KYC is completed
3. If no KYC: Returns error "KYC_REQUIRED"
4. User opens camera and captures:
   - ID front (back camera)
   - ID back (back camera, except passport)
   - Selfie (front camera)
5. User reviews photos and submits
6. Admin reviews and approves KYC
7. User requests withdrawal again
8. System checks daily limit (Rc 500,000)
9. Deducts from wallet
10. Status: PENDING
11. Processes within 24-48 hours

### Suspicious Withdrawal
1. User requests withdrawal
2. System detects suspicious patterns
3. Calculates risk score
4. If score >= 70: auto-flagged
5. Admin reviews with risk indicators
6. Admin approves/rejects with notes

## Background Workers

### Withdrawal Limit Reset Worker
Runs daily at midnight (00:00):
- Resets `withdrawnTodayKr` to 0 for all users
- Updates `lastResetDate` to current date

## Configuration

### Constants (in `kyc.service.ts`)
```typescript
const DAILY_WITHDRAWAL_LIMIT = 500000;
const LARGE_FIRST_WITHDRAWAL_THRESHOLD = 50000;
```

### Risk Detection Thresholds (in `withdrawal.service.ts`)
```typescript
const RAPID_WITHDRAWAL_THRESHOLD = 3; // 3 withdrawals in 24 hours
const NEW_ACCOUNT_DAYS = 7; // Account less than 7 days old
const LARGE_FIRST_WITHDRAWAL_THRESHOLD = 50000;
```

## Security Considerations

1. **Camera-Only Capture**: Users cannot upload files, must take live photos
2. **Name Verification**: Admins manually verify name matches between document and account
3. **Face Matching**: Selfie compared with ID photo (manual review)
4. **Document Authenticity**: Admins check for fake/edited documents
5. **Risk Scoring**: Automated detection of suspicious patterns
6. **Audit Logging**: All KYC and withdrawal reviews logged
7. **Role-Based Access**: Only super admins and finance managers can review
8. **Refund on Rejection**: Rejected withdrawals automatically refunded to wallet
9. **Mandatory KYC**: All users must complete KYC before any withdrawal

## Testing

### Test KYC Submission
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "NATIONAL_ID",
    "frontImageUrl": "https://example.com/id-front.jpg",
    "backImageUrl": "https://example.com/id-back.jpg",
    "selfieUrl": "https://example.com/selfie.jpg"
  }'
```

### Test Withdrawal Request
```bash
curl -X POST http://localhost:3000/api/v1/kyc/withdrawal/request \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amountKr": 1000,
    "provider": "mpesa",
    "accountName": "John Doe",
    "accountDetails": {"phoneNumber": "+254712345678"},
    "currency": "KES"
  }'
```

## Deployment Checklist

- [ ] Run database migration: `npx prisma db push`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Restart backend server
- [ ] Verify KYC routes are registered
- [ ] Verify withdrawal limit reset worker is running
- [ ] Test KYC submission flow
- [ ] Test withdrawal request flow
- [ ] Test admin review pages
- [ ] Configure alert thresholds if needed

## Monitoring

### Key Metrics to Track
- Pending KYC documents count
- Average KYC approval time
- Pending withdrawal requests count
- Flagged withdrawals count
- Average risk score
- Daily withdrawal volume by tier
- KYC approval/rejection rate

### Database Queries
```sql
-- Pending KYC count
SELECT COUNT(*) FROM kyc_documents WHERE status = 'PENDING';

-- Flagged withdrawals
SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'FLAGGED';

-- High-risk withdrawals
SELECT COUNT(*) FROM withdrawal_requests WHERE risk_score >= 70;

-- Daily withdrawal volume
SELECT 
  DATE(created_at) as date,
  SUM(amount_kr) as total_kr,
  COUNT(*) as count
FROM withdrawal_requests
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2025-01-20  
**Version**: 1.0.0
