# Suspicious Activity Report (SAR) API Documentation

## Overview
The SAR API provides endpoints for creating, managing, and exporting Suspicious Activity Reports for compliance purposes.

## Base URL
```
/api/compliance/sar
```

## Authentication
All endpoints require authentication and admin privileges.

## Endpoints

### 1. Create SAR
**POST** `/api/compliance/sar`

Create a new Suspicious Activity Report.

**Request Body:**
```json
{
  "user_id": "string",
  "activity_type": "string",
  "description": "string",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "related_transactions": ["string"],
  "evidence_urls": ["string"],
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "sar": {
    "id": "string",
    "user_id": "string",
    "activity_type": "string",
    "description": "string",
    "severity": "HIGH",
    "status": "DRAFT",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All SARs
**GET** `/api/compliance/sar`

Retrieve all SARs with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, FILED, ACKNOWLEDGED, CLOSED)
- `severity` (optional): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `activity_type` (optional): Filter by activity type
- `user_id` (optional): Filter by user ID
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "sars": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

### 3. Get SAR by ID
**GET** `/api/compliance/sar/:sarId`

Retrieve a specific SAR by ID.

**Response:**
```json
{
  "success": true,
  "sar": {
    "id": "string",
    "user_id": "string",
    "activity_type": "string",
    "description": "string",
    "severity": "HIGH",
    "status": "DRAFT",
    "related_transactions": [],
    "evidence_urls": [],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Generate SAR Template
**GET** `/api/compliance/sar/:sarId/generate`

Generate a complete SAR template with all required information for regulatory filing.

**Response:**
```json
{
  "success": true,
  "template": {
    "report_number": "SAR-1234567890-abc12345",
    "filing_date": "2024-01-01T00:00:00.000Z",
    "subject_information": {
      "user_id": "string",
      "name": "John Doe",
      "email": "john@example.com",
      "country": "US",
      "account_created": "2023-01-01T00:00:00.000Z",
      "kyc_status": "APPROVED"
    },
    "suspicious_activity": {
      "type": "SELF_TIPPING",
      "description": "User detected tipping themselves",
      "severity": "HIGH",
      "date_detected": "2024-01-01T00:00:00.000Z"
    },
    "transaction_details": [],
    "risk_assessment": {
      "risk_score": 75,
      "risk_level": "HIGH",
      "risk_factors": []
    },
    "evidence": {
      "urls": [],
      "metadata": {}
    },
    "recommendation": "string"
  }
}
```

### 5. Update SAR Status
**PUT** `/api/compliance/sar/:sarId/status`

Update the status of a SAR.

**Request Body:**
```json
{
  "status": "DRAFT | FILED | ACKNOWLEDGED | CLOSED",
  "filed_by": "string (optional)",
  "regulatory_body": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "sar": {
    "id": "string",
    "status": "FILED",
    "filed_at": "2024-01-01T00:00:00.000Z",
    "filed_by": "admin-user-id",
    "regulatory_body": "FinCEN"
  }
}
```

### 6. Export SARs to CSV
**GET** `/api/compliance/sar/export/csv`

Export SARs to CSV format.

**Query Parameters:**
- `status` (optional): Filter by status
- `severity` (optional): Filter by severity
- `activity_type` (optional): Filter by activity type
- `date_from` (optional): Start date (ISO 8601)
- `date_to` (optional): End date (ISO 8601)

**Response:**
CSV file download with headers:
- report_number
- user_id
- activity_type
- description
- severity
- status
- filed_at
- filed_by
- regulatory_body
- related_transactions
- created_at
- updated_at

### 7. Export SARs to PDF
**GET** `/api/compliance/sar/export/pdf`

Export SARs to PDF format.

**Query Parameters:**
Same as CSV export.

**Response:**
PDF file download with formatted SAR reports.

### 8. Mark Activity as Reported
**POST** `/api/compliance/sar/mark-reported`

Track which activities have been reported to avoid duplicate SARs.

**Request Body:**
```json
{
  "user_id": "string",
  "activity_type": "string",
  "transaction_ids": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "alreadyReported": false,
  "sar": {
    "id": "string",
    "activity_type": "string",
    "status": "DRAFT"
  }
}
```

## Activity Types

Common activity types include:
- `SELF_TIPPING` - User tipping themselves through multiple accounts
- `CIRCULAR_TIPPING` - Circular tipping patterns (A→B→C→A)
- `RAPID_WITHDRAWAL` - Rapid buy-tip-withdraw cycles
- `CHAMA_FRAUD` - Fake chamas used for money laundering
- `VELOCITY_VIOLATION` - Exceeding transaction velocity limits
- `HIGH_RISK_COUNTRY` - Transactions from high-risk countries
- `VPN_DETECTED` - VPN usage detected
- `KYC_FRAUD` - Fraudulent KYC documents

## Status Flow

```
DRAFT → FILED → ACKNOWLEDGED → CLOSED
```

- **DRAFT**: SAR created but not yet filed
- **FILED**: SAR filed with regulatory body
- **ACKNOWLEDGED**: Regulatory body acknowledged receipt
- **CLOSED**: Investigation completed

## Severity Levels

- **LOW**: Monitor closely, no immediate action required
- **MEDIUM**: Request additional documentation, limit transaction amounts
- **HIGH**: Urgent review required, restrict account activity
- **CRITICAL**: Immediate action required, suspend account

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden - Admin access required"
}
```

**404 Not Found**
```json
{
  "error": "SAR not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Error message"
}
```

## Example Usage

### Create and File a SAR

```javascript
// 1. Create SAR
const createResponse = await fetch('/api/compliance/sar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user-123',
    activity_type: 'SELF_TIPPING',
    description: 'User detected tipping themselves through 3 accounts',
    severity: 'HIGH',
    related_transactions: ['tx-1', 'tx-2', 'tx-3'],
    evidence_urls: ['https://example.com/evidence.png']
  })
});

const { sar } = await createResponse.json();

// 2. Generate SAR template
const templateResponse = await fetch(`/api/compliance/sar/${sar.id}/generate`, {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

const { template } = await templateResponse.json();

// 3. Update status to FILED
const updateResponse = await fetch(`/api/compliance/sar/${sar.id}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'FILED',
    regulatory_body: 'FinCEN'
  })
});
```

### Export SARs

```javascript
// Export to CSV
window.location.href = '/api/compliance/sar/export/csv?severity=HIGH&status=FILED';

// Export to PDF
window.location.href = '/api/compliance/sar/export/pdf?date_from=2024-01-01&date_to=2024-12-31';
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- SAR report numbers are automatically generated when creating a SAR template
- Related transactions are stored as an array of transaction IDs
- Evidence URLs should be publicly accessible or stored in a secure location
- Metadata field can store any additional context as JSON
