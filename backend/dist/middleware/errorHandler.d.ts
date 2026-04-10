import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
export declare class AppError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status?: number, code?: string);
}
export declare function errorHandler(err: Error | AppError | ZodError, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map