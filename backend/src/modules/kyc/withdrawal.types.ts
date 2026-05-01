// Enhanced withdrawal request types with security parameters

export interface WithdrawalRequestBody {
  // Basic withdrawal info
  amountKr: number;
  provider: string;
  accountName: string;
  accountDetails: any;
  currency?: string;
  
  // Transaction signing (existing)
  signature: string;
  timestamp: number;
  nonce: string;
  
  // NEW: Hardware security parameters
  hardwareSignature?: string;
  deviceId?: string;
  
  // NEW: Biometric authentication proof
  biometricVerified?: boolean;
  biometricTimestamp?: number;
  
  // NEW: Multi-signature (for high-value transactions)
  multiSigSignatures?: string[];
  multiSigApprovers?: string[];
  
  // NEW: Rate limiting metadata
  rateLimitToken?: string;
}

export interface WithdrawalSecurityMetadata {
  // Hardware security
  hardwareSecurityUsed: boolean;
  hardwareSignature?: string;
  deviceId?: string;
  deviceModel?: string;
  
  // Biometric authentication
  biometricVerified: boolean;
  biometricTimestamp?: number;
  biometricType?: 'fingerprint' | 'face' | 'iris';
  
  // Multi-signature
  multiSigRequired: boolean;
  multiSigSignatures?: string[];
  multiSigApprovers?: string[];
  
  // Rate limiting
  rateLimitChecked: boolean;
  rateLimitToken?: string;
  
  // Device security
  deviceSecurityScore: number;
  isRooted?: boolean;
  isEmulator?: boolean;
}
