import { Router } from 'express';
import { ComplianceController } from './compliance.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/admin.js';

const router = Router();

// Risk Scoring
router.get('/risk-profile/:userId', authenticate, ComplianceController.getUserRiskProfile);
router.post('/risk-profile/:userId/recalculate', authenticate, ComplianceController.recalculateRiskScore);

// Locked Chat Tasks
router.get('/chat-access/:creatorId', authenticate, ComplianceController.checkChatAccess);
router.post('/chat/unlock', authenticate, ComplianceController.unlockChatForTask);
router.post('/chat/task/:taskId/complete', authenticate, ComplianceController.completeTask);
router.get('/chat/settings/:creatorId', ComplianceController.getLockedChatSettings);
router.put('/chat/settings', authenticate, ComplianceController.updateLockedChatSettings);
router.get('/chat/tasks/user', authenticate, ComplianceController.getUserActiveTasks);
router.get('/chat/tasks/creator', authenticate, ComplianceController.getCreatorPendingTasks);

// Contest Validation
router.post('/contest/validate', authenticate, ComplianceController.validateContest);
router.get('/contest/:contestId/validation', ComplianceController.getContestValidationStatus);

// Admin Routes - Compliance Dashboard
router.get('/flagged-transactions', authenticate, isAdmin, ComplianceController.getFlaggedTransactions);
router.put('/flagged-transactions/:flagId/review', authenticate, isAdmin, ComplianceController.reviewFlaggedTransaction);
router.get('/suspicious-activity', authenticate, isAdmin, ComplianceController.getSuspiciousActivityLogs);
router.post('/screen-user/:userId', authenticate, isAdmin, ComplianceController.screenUser);

// SAR (Suspicious Activity Reports) Routes
router.post('/sar', authenticate, isAdmin, ComplianceController.createSAR);
router.get('/sar', authenticate, isAdmin, ComplianceController.getSARs);
router.get('/sar/:sarId', authenticate, isAdmin, ComplianceController.getSARById);
router.get('/sar/:sarId/generate', authenticate, isAdmin, ComplianceController.generateSAR);
router.put('/sar/:sarId/status', authenticate, isAdmin, ComplianceController.updateSARStatus);
router.get('/sar/export/csv', authenticate, isAdmin, ComplianceController.exportSARsToCSV);
router.get('/sar/export/pdf', authenticate, isAdmin, ComplianceController.exportSARsToPDF);
router.post('/sar/mark-reported', authenticate, isAdmin, ComplianceController.markActivityAsReported);

// Device Tracking (can be called by any authenticated user)
router.post('/track-device', authenticate, ComplianceController.trackDevice);

// Compliance Dashboard Overview (admin only)
router.get('/dashboard', authenticate, isAdmin, ComplianceController.getComplianceDashboard);
router.get('/high-risk-users', authenticate, isAdmin, ComplianceController.getHighRiskUsers);
router.get('/audit-logs', authenticate, isAdmin, ComplianceController.getAuditLogs);

// KYC Tiers
router.get('/kyc-tier/:userId', authenticate, ComplianceController.getUserKYCTier);
router.get('/kyc-tiers', ComplianceController.getAllKYCTiers);

export default router;
