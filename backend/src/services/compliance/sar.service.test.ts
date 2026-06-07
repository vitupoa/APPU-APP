import { sarService } from './sar.service';
import { prisma } from '../../config/database';
import crypto from 'crypto';

/**
 * SAR Service Tests
 * Tests for Suspicious Activity Report functionality
 */

describe('SAR Service', () => {
  let testUserId: string;
  let testSARId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({ data: { id: crypto.randomUUID(), email: 'sar-test@example.com',
        username: 'sar_test_user',
        first_name: 'SAR',
        last_name: 'Test',
        display_name: 'SAR Test User',
        country: 'US',
        currency: 'USD',
        password_hash: 'test_hash',
        updated_at: new Date()}} as any));
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testSARId) {
      await prisma.suspicious_activity_reports.delete({
        where: { id: testSARId }
      }).catch(() => {});
    }
    
    await prisma.user.delete({
      where: { id: testUserId }
    }).catch(() => {});

    await prisma.$disconnect();
  });

  describe('createSAR', () => {
    it('should create a new SAR with DRAFT status', async () => {
      const sarData = {
        user_id: testUserId,
        activity_type: 'SELF_TIPPING',
        description: 'User detected tipping themselves through multiple accounts',
        severity: 'HIGH' as const,
        related_transactions: ['tx1', 'tx2'],
        evidence_urls: ['https://example.com/evidence1.png']
      };

      const sar = await sarService.createSAR(sarData);
      testSARId = sar.id;

      expect(sar).toBeDefined();
      expect(sar.user_id).toBe(testUserId);
      expect(sar.activity_type).toBe('SELF_TIPPING');
      expect(sar.severity).toBe('HIGH');
      expect(sar.status).toBe('DRAFT');
      expect(sar.related_transactions).toEqual(['tx1', 'tx2']);
    });

    it('should throw error for non-existent user', async () => {
      const sarData = {
        user_id: 'non-existent-user-id',
        activity_type: 'SELF_TIPPING',
        description: 'Test',
        severity: 'LOW' as const
      };

      await expect(sarService.createSAR(sarData)).rejects.toThrow();
    });
  });

  describe('generateSAR', () => {
    it('should generate SAR template with all required fields', async () => {
      const template = await sarService.generateSAR(testSARId);

      expect(template).toBeDefined();
      expect(template.report_number).toBeDefined();
      expect(template.subject_information).toBeDefined();
      expect(template.subject_information.user_id).toBe(testUserId);
      expect(template.suspicious_activity).toBeDefined();
      expect(template.suspicious_activity.type).toBe('SELF_TIPPING');
      expect(template.risk_assessment).toBeDefined();
      expect(template.recommendation).toBeDefined();
    });

    it('should throw error for non-existent SAR', async () => {
      await expect(sarService.generateSAR('non-existent-sar-id')).rejects.toThrow();
    });
  });

  describe('updateSARStatus', () => {
    it('should update SAR status to FILED', async () => {
      const updated = await sarService.updateSARStatus(
        testSARId,
        'FILED',
        'admin-user-id',
        'FinCEN'
      );

      expect(updated.status).toBe('FILED');
      expect(updated.filed_by).toBe('admin-user-id');
      expect(updated.regulatory_body).toBe('FinCEN');
      expect(updated.filed_at).toBeDefined();
    });

    it('should update SAR status to CLOSED', async () => {
      const updated = await sarService.updateSARStatus(testSARId, 'CLOSED');

      expect(updated.status).toBe('CLOSED');
    });
  });

  describe('getSARs', () => {
    it('should retrieve SARs with filters', async () => {
      const result = await sarService.getSARs({
        severity: 'HIGH',
        limit: 10,
        offset: 0
      });

      expect(result).toBeDefined();
      expect(result.sars).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter by user_id', async () => {
      const result = await sarService.getSARs({
        user_id: testUserId,
        limit: 10,
        offset: 0
      });

      expect(result.sars.length).toBeGreaterThan(0);
      expect(result.sars[0].user_id).toBe(testUserId);
    });
  });

  describe('exportToCSV', () => {
    it('should export SARs to CSV format', async () => {
      const csv = await sarService.exportToCSV({
        format: 'CSV',
        severity: 'HIGH'
      });

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('report_number');
      expect(csv).toContain('user_id');
      expect(csv).toContain('activity_type');
    });
  });

  describe('exportToPDF', () => {
    it('should export SARs to PDF format', async () => {
      const pdf = await sarService.exportToPDF({
        format: 'PDF',
        severity: 'HIGH'
      });

      expect(pdf).toBeDefined();
      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe('markActivityAsReported', () => {
    it('should create SAR for unreported activity', async () => {
      const result = await sarService.markActivityAsReported(
        testUserId,
        'CIRCULAR_TIPPING',
        ['tx3', 'tx4']
      );

      expect(result.alreadyReported).toBe(false);
      expect(result.sar).toBeDefined();
      expect(result.sar.activity_type).toBe('CIRCULAR_TIPPING');

      // Clean up
      await prisma.suspicious_activity_reports.delete({
        where: { id: result.sar.id }
      }).catch(() => {});
    });

    it('should detect already reported activity', async () => {
      // First, mark as FILED
      await sarService.updateSARStatus(testSARId, 'FILED');

      const result = await sarService.markActivityAsReported(
        testUserId,
        'SELF_TIPPING',
        []
      );

      expect(result.alreadyReported).toBe(true);
      expect(result.sar.id).toBe(testSARId);
    });
  });
});
