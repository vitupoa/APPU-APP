"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
class AppError extends Error {
    status;
    code;
    constructor(message, status = 500, code) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const details = err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details,
        });
        return;
    }
    // Known application errors
    if (err instanceof AppError) {
        res.status(err.status).json({
            error: err.message,
            code: err.code,
        });
        return;
    }
    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(409).json({
            error: 'Database conflict — resource may already exist',
            code: 'DB_CONFLICT',
        });
        return;
    }
    // Unknown errors
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
}
//# sourceMappingURL=errorHandler.js.map