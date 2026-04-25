import { Response } from 'express';
import { ChamaElectionService } from './chama-election.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ChamaElectionController {
  static async startElection(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const { position, isMidTerm } = req.body;
      const result = await ChamaElectionService.startElection(req.userId!, chamaId, position, isMidTerm);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async nominate(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const { nomineeId } = req.body;
      const result = await ChamaElectionService.nominate(req.userId!, chamaId, electionId, nomineeId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async secondNomination(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const nominationId = String(req.params.nid);
      const result = await ChamaElectionService.secondNomination(req.userId!, chamaId, electionId, nominationId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async advanceToVoting(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const result = await ChamaElectionService.advanceToVoting(req.userId!, chamaId, electionId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async castVote(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const { nominationId } = req.body;
      const result = await ChamaElectionService.castVote(req.userId!, chamaId, electionId, nominationId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async tallyVotes(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const result = await ChamaElectionService.tallyVotes(req.userId!, chamaId, electionId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getElectionStatus(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const electionId = String(req.params.eid);
      const election = await ChamaElectionService.getElectionStatus(chamaId, electionId);
      if (!election) return res.status(404).json({ success: false, error: 'Election not found' });
      return res.json({ success: true, election });
    } catch (e: any) {
      return res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getActiveElections(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const elections = await ChamaElectionService.getActiveElections(chamaId);
      res.json({ success: true, elections });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
