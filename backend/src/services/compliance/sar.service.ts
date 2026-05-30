import { prisma } from '../../config/database.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * SAR (Suspicious Activity Report) Service
 * Handles creation, tracking, and export of suspicious activity reports
 * Requirements: 2.13.2
 */

export interface SARData {
  user_id: string;
  activity_type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  related_transactions?: string[];
  evidence_urls?: string[];
  metadata?: any;
}

export interface SARTemplate {
  report_number: string;
  filing_date: string;
  subject_information: {
    user_id: string;
    name: string;
    email: string;
    country: string;
    account_created: string;
    kyc_status: string;
  };
  suspicious_activity: {
    type: string;
    description: string;
    severity: string;
    date_detected: string;
  };
  transaction_details: Array<{
    transaction_id: string;
    date: string;
    amount_kr: string;
    type: string;
    description: string;
  }>;
  risk_assessment: {
    risk_score: number;
    risk_level: string;
    risk_factors: string[];
  };
  evidence: {
    urls: string[];
    metadata: any;
  };
  recommendation: string;
}

export interface SARExportOptions {
  format: 'CSV' | 'PDF';
  status?: string;
  severity?: string;
  activity_type?: string;
  date_from?: Date;
  date_to?: Date;
}

class SARService {
  /**
   * Create a new SAR (Suspicious Activity Report)
   */
  async createSAR(data: SARData): Promise<any> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: data.user_id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create SAR with DRAFT status
      const sar = await prisma.suspicious_activity_reports.create({
        data: {
          user_id: data.user_id,
          activity_type: data.activity_type,
          description: data.description,
          severity: data.severity,
          status: 'DRAFT',
          related_transactions: data.related_transactions || [],
          evidence_urls: data.evidence_urls || [],
          metadata: data.metadata || {}
        }
      });

      return sar;
    } catch (error: any) {
      console.error('Error creating SAR:', error);
      throw new Error(`Failed to create SAR: ${error.message}`);
    }
  }

  /**
   * Generate SAR template with all required information
   */
  async generateSAR(sarId: string): Promise<SARTemplate> {
    try {
      // Get SAR record
      const sar = await prisma.suspicious_activity_reports.findUnique({
        where: { id: sarId }
      });

      if (!sar) {
        throw new Error('SAR not found');
      }

      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: sar.user_id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          country: true,
          created_at: true,
          kyc_status: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's risk profile
      const riskProfile = await prisma.user_risk_profiles.findUnique({
        where: { user_id: sar.user_id }
      });

      // Get related transactions
      const transactions = await prisma.transactions.findMany({
        where: {
          id: {
            in: sar.related_transactions as string[]
          }
        },
        select: {
          id: true,
          created_at: true,
          amount_kr: true,
          transaction_type: true,
          description: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Generate report number if not exists
      let reportNumber = sar.report_number;
      if (!reportNumber) {
        reportNumber = `SAR-${Date.now()}-${sar.user_id.substring(0, 8)}`;
        
        // Update SAR with report number
        await prisma.suspicious_activity_reports.update({
          where: { id: sarId },
          data: { report_number: reportNumber }
        });
      }

      // Build SAR template
      const template: SARTemplate = {
        report_number: reportNumber,
        filing_date: new Date().toISOString(),
        subject_information: {
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          country: user.country,
          account_created: user.created_at.toISOString(),
          kyc_status: user.kyc_status
        },
        suspicious_activity: {
          type: sar.activity_type,
          description: sar.description,
          severity: sar.severity,
          date_detected: sar.created_at.toISOString()
        },
        transaction_details: transactions.map(tx => ({
          transaction_id: tx.id,
          date: tx.created_at.toISOString(),
          amount_kr: tx.amount_kr.toString(),
          type: tx.transaction_type || 'UNKNOWN',
          description: tx.description || ''
        })),
        risk_assessment: {
          risk_score: riskProfile?.risk_score || 0,
          risk_level: riskProfile?.risk_level || 'UNKNOWN',
          risk_factors: this.extractRiskFactors(riskProfile)
        },
        evidence: {
          urls: sar.evidence_urls as string[],
          metadata: sar.metadata
        },
        recommendation: this.generateRecommendation(sar.severity, sar.activity_type)
      };

      return template;
    } catch (error: any) {
      console.error('Error generating SAR template:', error);
      throw new Error(`Failed to generate SAR template: ${error.message}`);
    }
  }

  /**
   * Export suspicious activity logs to CSV
   */
  async exportToCSV(options: SARExportOptions): Promise<string> {
    try {
      // Build query filters
      const where: any = {};
      if (options.status) where.status = options.status;
      if (options.severity) where.severity = options.severity;
      if (options.activity_type) where.activity_type = options.activity_type;
      if (options.date_from || options.date_to) {
        where.created_at = {};
        if (options.date_from) where.created_at.gte = options.date_from;
        if (options.date_to) where.created_at.lte = options.date_to;
      }

      // Fetch SARs
      const sars = await prisma.suspicious_activity_reports.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });

      // Prepare data for CSV
      const csvData = sars.map(sar => ({
        report_number: sar.report_number || 'N/A',
        user_id: sar.user_id,
        activity_type: sar.activity_type,
        description: sar.description,
        severity: sar.severity,
        status: sar.status,
        filed_at: sar.filed_at ? sar.filed_at.toISOString() : 'N/A',
        filed_by: sar.filed_by || 'N/A',
        regulatory_body: sar.regulatory_body || 'N/A',
        related_transactions: (sar.related_transactions as string[]).join('; '),
        created_at: sar.created_at.toISOString(),
        updated_at: sar.updated_at.toISOString()
      }));

      // Convert to CSV
      const parser = new Parser({
        fields: [
          'report_number',
          'user_id',
          'activity_type',
          'description',
          'severity',
          'status',
          'filed_at',
          'filed_by',
          'regulatory_body',
          'related_transactions',
          'created_at',
          'updated_at'
        ]
      });

      const csv = parser.parse(csvData);
      return csv;
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export suspicious activity logs to PDF
   */
  async exportToPDF(options: SARExportOptions): Promise<Buffer> {
    try {
      // Build query filters
      const where: any = {};
      if (options.status) where.status = options.status;
      if (options.severity) where.severity = options.severity;
      if (options.activity_type) where.activity_type = options.activity_type;
      if (options.date_from || options.date_to) {
        where.created_at = {};
        if (options.date_from) where.created_at.gte = options.date_from;
        if (options.date_to) where.created_at.lte = options.date_to;
      }

      // Fetch SARs
      const sars = await prisma.suspicious_activity_reports.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      // Add title
      doc.fontSize(20).text('Suspicious Activity Reports', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);

      // Add summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Total Reports: ${sars.length}`);
      doc.text(`Status Filter: ${options.status || 'All'}`);
      doc.text(`Severity Filter: ${options.severity || 'All'}`);
      doc.moveDown(2);

      // Add each SAR
      for (const sar of sars) {
        doc.fontSize(12).text(`Report: ${sar.report_number || 'DRAFT'}`, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`User ID: ${sar.user_id}`);
        doc.text(`Activity Type: ${sar.activity_type}`);
        doc.text(`Severity: ${sar.severity}`);
        doc.text(`Status: ${sar.status}`);
        doc.text(`Description: ${sar.description}`);
        doc.text(`Created: ${sar.created_at.toISOString()}`);
        
        if (sar.filed_at) {
          doc.text(`Filed: ${sar.filed_at.toISOString()}`);
        }
        
        if (sar.filed_by) {
          doc.text(`Filed By: ${sar.filed_by}`);
        }

        if ((sar.related_transactions as string[]).length > 0) {
          doc.text(`Related Transactions: ${(sar.related_transactions as string[]).length}`);
        }

        doc.moveDown(1.5);

        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      }

      // Finalize PDF
      doc.end();

      // Wait for PDF to finish
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      throw new Error(`Failed to export to PDF: ${error.message}`);
    }
  }

  /**
   * Update SAR status
   */
  async updateSARStatus(
    sarId: string,
    status: 'DRAFT' | 'FILED' | 'ACKNOWLEDGED' | 'CLOSED',
    filedBy?: string,
    regulatoryBody?: string
  ): Promise<any> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      };

      if (status === 'FILED') {
        updateData.filed_at = new Date();
        if (filedBy) updateData.filed_by = filedBy;
        if (regulatoryBody) updateData.regulatory_body = regulatoryBody;
      }

      const sar = await prisma.suspicious_activity_reports.update({
        where: { id: sarId },
        data: updateData
      });

      return sar;
    } catch (error: any) {
      console.error('Error updating SAR status:', error);
      throw new Error(`Failed to update SAR status: ${error.message}`);
    }
  }

  /**
   * Get SAR by ID
   */
  async getSARById(sarId: string): Promise<any> {
    try {
      const sar = await prisma.suspicious_activity_reports.findUnique({
        where: { id: sarId }
      });

      if (!sar) {
        throw new Error('SAR not found');
      }

      return sar;
    } catch (error: any) {
      console.error('Error getting SAR:', error);
      throw new Error(`Failed to get SAR: ${error.message}`);
    }
  }

  /**
   * Get all SARs with filters
   */
  async getSARs(filters: {
    status?: string;
    severity?: string;
    activity_type?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sars: any[]; total: number }> {
    try {
      const where: any = {};
      if (filters.status) where.status = filters.status;
      if (filters.severity) where.severity = filters.severity;
      if (filters.activity_type) where.activity_type = filters.activity_type;
      if (filters.user_id) where.user_id = filters.user_id;

      const [sars, total] = await Promise.all([
        prisma.suspicious_activity_reports.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.suspicious_activity_reports.count({ where })
      ]);

      return { sars, total };
    } catch (error: any) {
      console.error('Error getting SARs:', error);
      throw new Error(`Failed to get SARs: ${error.message}`);
    }
  }

  /**
   * Track which activities have been reported
   */
  async markActivityAsReported(
    userId: string,
    activityType: string,
    transactionIds: string[]
  ): Promise<any> {
    try {
      // Check if already reported
      const existing = await prisma.suspicious_activity_reports.findFirst({
        where: {
          user_id: userId,
          activity_type: activityType,
          status: { in: ['FILED', 'ACKNOWLEDGED'] }
        }
      });

      if (existing) {
        return { alreadyReported: true, sar: existing };
      }

      // Create new SAR
      const sar = await this.createSAR({
        user_id: userId,
        activity_type: activityType,
        description: `Suspicious activity detected: ${activityType}`,
        severity: 'MEDIUM',
        related_transactions: transactionIds
      });

      return { alreadyReported: false, sar };
    } catch (error: any) {
      console.error('Error marking activity as reported:', error);
      throw new Error(`Failed to mark activity as reported: ${error.message}`);
    }
  }

  /**
   * Extract risk factors from risk profile
   */
  private extractRiskFactors(riskProfile: any): string[] {
    if (!riskProfile) return [];

    const factors: string[] = [];

    if (riskProfile.kyc_status !== 'APPROVED') {
      factors.push(`KYC Status: ${riskProfile.kyc_status}`);
    }

    if (riskProfile.is_high_risk_country) {
      factors.push('High-risk country');
    }

    if (riskProfile.vpn_detected) {
      factors.push('VPN detected');
    }

    if (riskProfile.self_tipping_score > 50) {
      factors.push(`Self-tipping score: ${riskProfile.self_tipping_score}`);
    }

    if (riskProfile.circular_tipping_score > 50) {
      factors.push(`Circular tipping score: ${riskProfile.circular_tipping_score}`);
    }

    return factors;
  }

  /**
   * Generate recommendation based on severity and activity type
   */
  private generateRecommendation(severity: string, activityType: string): string {
    const recommendations: Record<string, string> = {
      CRITICAL: 'Immediate action required. Suspend account and block all transactions. File SAR with regulatory body within 24 hours.',
      HIGH: 'Urgent review required. Restrict account activity and require enhanced KYC verification. File SAR within 48 hours.',
      MEDIUM: 'Monitor closely. Request additional documentation and limit transaction amounts. Consider filing SAR if pattern continues.',
      LOW: 'Continue monitoring. Document activity for future reference. No immediate action required.'
    };

    return recommendations[severity] || 'Review and take appropriate action based on internal policies.';
  }
}

export const sarService = new SARService();
