"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
/**
 * Global Zod Validation Middleware
 * Validates request body, query, and params against the provided Zod schema.
 */
const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
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
exports.validateRequest = validateRequest;
//# sourceMappingURL=validate.js.map