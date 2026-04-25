import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { ChamaController } from './chama.controller.js';
import { ChamaFinanceController } from './chama-finance.controller.js';
import { ChamaElectionController } from './chama-election.controller.js';
import { ChamaCycleController } from './chama-cycle.controller.js';
import { ChamaRiskController } from './chama-risk.controller.js';
import {
  createChamaSchema,
  updateChamaSchema,
  removeMemberSchema,
  contributeSchema,
  requestPayoutSchema,
  approvePayoutSchema,
} from './chama.validation.js';

export const chamaRoutes = Router();

chamaRoutes.use(requireAuth);

// CRUD
chamaRoutes.post('/', validateRequest(createChamaSchema), ChamaController.create);
chamaRoutes.get('/', ChamaController.getMyChamas);
chamaRoutes.get('/discover', ChamaController.discover);
chamaRoutes.get('/defaulters', ChamaController.getDefaulters);
chamaRoutes.get('/:id', ChamaController.getById);
chamaRoutes.put('/:id', validateRequest(updateChamaSchema), ChamaController.update);

// Membership
chamaRoutes.post('/:id/join', ChamaController.join);
chamaRoutes.post('/:id/leave', ChamaController.leave);
chamaRoutes.post('/:id/activate', ChamaController.activate);
chamaRoutes.delete('/:id/members/:uid', ChamaController.removeMember);

// Finance
chamaRoutes.post('/:id/contribute', validateRequest(contributeSchema), ChamaFinanceController.contribute);
chamaRoutes.post('/:id/payout', validateRequest(requestPayoutSchema), ChamaFinanceController.requestPayout);
chamaRoutes.post('/:id/payout/:pid/approve', validateRequest(approvePayoutSchema), ChamaFinanceController.approvePayout);
chamaRoutes.get('/:id/balance', ChamaFinanceController.getBalance);
chamaRoutes.get('/:id/transactions', ChamaFinanceController.getTransactions);
chamaRoutes.post('/:id/receipt', ChamaFinanceController.uploadReceipt);

// Cycles (Merry-Go-Round)
chamaRoutes.post('/:id/cycles', ChamaCycleController.openCycle);
chamaRoutes.get('/:id/cycles', ChamaCycleController.getCycles);
chamaRoutes.post('/:id/cycles/:cid/disburse', ChamaCycleController.disburseCycle);

// Elections
chamaRoutes.get('/:id/elections/active', ChamaElectionController.getActiveElections);
chamaRoutes.post('/:id/elections', ChamaElectionController.startElection);
chamaRoutes.get('/:id/elections/:eid', ChamaElectionController.getElectionStatus);
chamaRoutes.post('/:id/elections/:eid/nominate', ChamaElectionController.nominate);
chamaRoutes.post('/:id/elections/:eid/second/:nid', ChamaElectionController.secondNomination);
chamaRoutes.post('/:id/elections/:eid/advance', ChamaElectionController.advanceToVoting);
chamaRoutes.post('/:id/elections/:eid/vote', ChamaElectionController.castVote);
chamaRoutes.post('/:id/elections/:eid/tally', ChamaElectionController.tallyVotes);

// Defaulter resolution
chamaRoutes.post('/defaulters/:defaultId/resolve', ChamaController.resolveDefault);

// Risk Management
chamaRoutes.post('/risk/check-defaults', ChamaRiskController.checkDefaults);
chamaRoutes.post('/:id/risk/flag-defaulter', ChamaRiskController.flagDefaulter);
chamaRoutes.post('/:id/risk/send-reminder', ChamaRiskController.sendReminder);
chamaRoutes.post('/:id/risk/apply-penalty', ChamaRiskController.applyPenalty);
chamaRoutes.get('/risk/user-status', ChamaRiskController.getUserDefaultStatus);
