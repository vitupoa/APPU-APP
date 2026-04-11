import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
/**
 * Global Zod Validation Middleware
 * Validates request body, query, and params against the provided Zod schema.
 */
export declare const validateRequest: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map