import { prisma } from '../../config/database.js';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';

export class DeviceFingerprintService {
  /**
   * Generate device fingerprint from request (server-side)
   */
  generateFingerprint(req: Request): {
    fingerprint_hash: string;
    user_agent: string;
    ip_address: string;
    browser: string | undefined;
    os: string | undefined;
    device_type: string | undefined;
  } {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.getClientIP(req);
    
    // Parse user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Create fingerprint from multiple factors
    const fingerprintData = {
      userAgent,
      ip: ipAddress,
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || '',
      // Add more headers for better fingerprinting
    };

    // Generate hash
    const fingerprintString = JSON.stringify(fingerprintData);
    const fingerprint_hash = crypto
      .createHash('sha256')
      .update(fingerprintString)
      .digest('hex');

    return {
      fingerprint_hash,
      user_agent: userAgent,
      ip_address: ipAddress,
      browser: result.browser.name,
      os: result.os.name,
      device_type: result.device.type || 'desktop'
    };
  }

  /**
   * Track device fingerprint for user
   */
  async trackDevice(userId: string, req: Request): Promise<void> {
    const fingerprint = this.generateFingerprint(req);

    // Check if this fingerprint exists for this user
    const existing = await prisma.device_fingerprints.findUnique({
      where: {
        user_id_fingerprint_hash: {
          user_id: userId,
          fingerprint_hash: fingerprint.fingerprint_hash
        }
      }
    });

    if (existing) {
      // Update last seen and increment count
      await prisma.device_fingerprints.update({
        where: { id: existing.id },
        data: {
          last_seen_at: new Date(),
          request_count: { increment: 1 }
        }
      });
    } else {
      // Create new fingerprint record
      await prisma.device_fingerprints.create({
        data: {
          user_id: userId,
          fingerprint_hash: fingerprint.fingerprint_hash,
          user_agent: fingerprint.user_agent,
          ip_address: fingerprint.ip_address,
          browser: fingerprint.browser,
          os: fingerprint.os,
          device_type: fingerprint.device_type,
          first_seen_at: new Date(),
          last_seen_at: new Date(),
          request_count: 1
        }
      });

      // Check if this device is used by other users (fraud detection)
      await this.checkSharedDevice(fingerprint.fingerprint_hash, userId);
    }
  }

  /**
   * Check if device is shared across multiple users
   */
  private async checkSharedDevice(fingerprintHash: string, currentUserId: string): Promise<void> {
    const allUsersWithDevice = await prisma.device_fingerprints.findMany({
      where: { fingerprint_hash: fingerprintHash },
      select: { user_id: true }
    });

    const userIds = allUsersWithDevice.map(d => d.user_id);
    const uniqueUsers = [...new Set(userIds)];

    // If more than one user, mark as suspicious
    if (uniqueUsers.length > 1) {
      await prisma.device_fingerprints.updateMany({
        where: { fingerprint_hash: fingerprintHash },
        data: {
          is_suspicious: true,
          shared_with_users: uniqueUsers
        }
      });

      // Log suspicious activity
      await prisma.suspicious_activity_logs.create({
        data: {
          user_id: currentUserId,
          activityType: 'SHARED_DEVICE',
          description: `Device shared with ${uniqueUsers.length} users`,
          severity: 'MEDIUM',
          metadata: { shared_users: uniqueUsers }
        }
      });
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string {
    // Check various headers for real IP (behind proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    return req.headers['x-real-ip'] as string ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Check if user has suspicious device patterns
   */
  async checkDeviceSuspicion(userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    sharedDevices: number;
  }> {
    const devices = await prisma.device_fingerprints.findMany({
      where: { user_id: userId }
    });

    const reasons: string[] = [];
    let isSuspicious = false;

    // Check for suspicious devices
    const suspiciousDevices = devices.filter(d => d.is_suspicious);
    if (suspiciousDevices.length > 0) {
      isSuspicious = true;
      reasons.push(`${suspiciousDevices.length} shared devices detected`);
    }

    // Check for too many devices (possible account sharing)
    if (devices.length > 10) {
      isSuspicious = true;
      reasons.push(`Too many devices (${devices.length})`);
    }

    // Check for rapid device switching
    const recentDevices = devices.filter(d => 
      (Date.now() - d.last_seen_at.getTime()) < 24 * 60 * 60 * 1000
    );
    if (recentDevices.length > 5) {
      isSuspicious = true;
      reasons.push(`Rapid device switching (${recentDevices.length} in 24h)`);
    }

    return {
      isSuspicious,
      reasons,
      sharedDevices: suspiciousDevices.length
    };
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();
