import { ZodError } from 'zod';
/**
 * Global Zod Validation Middleware
 * Validates request body, query, and params against the provided Zod schema.
 */
export const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                })),
            });
            return;
        }
        next(error);
    }
};
//# sourceMappingURL=validate.js.map