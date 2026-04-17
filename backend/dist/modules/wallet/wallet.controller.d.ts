import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
export declare class WalletController {
    static getBalance(req: AuthRequest, res: Response): Promise<void>;
    static sendTip(req: AuthRequest, res: Response): Promise<void>;
    static getTransactions(req: AuthRequest, res: Response): Promise<void>;
    static searchUsers(req: AuthRequest, res: Response): Promise<void>;
    static getExchangeRate(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=wallet.controller.d.ts.map