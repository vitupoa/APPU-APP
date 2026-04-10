"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
class AuthController {
    static async register(req, res) {
        try {
            const data = auth_validation_1.registerSchema.parse(req.body);
            const result = await auth_service_1.AuthService.register(data);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    static async login(req, res) {
        try {
            const data = auth_validation_1.loginSchema.parse(req.body);
            const result = await auth_service_1.AuthService.login(data);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(401).json({ error: error.message });
            }
        }
    }
    static async oauthLogin(req, res) {
        try {
            const data = auth_validation_1.oauthSchema.parse(req.body);
            const result = await auth_service_1.AuthService.oauthLogin(data);
            res.status(result.isNewUser ? 201 : 200).json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                try {
                    // Check if error is our custom JSON error for OAUTH_INCOMPLETE / USERNAME_COLLISION
                    const parsed = JSON.parse(error.message);
                    if (parsed.code) {
                        res.status(400).json(parsed);
                        return;
                    }
                }
                catch { } // If not JSON parseable, it's a standard error
                res.status(401).json({ error: error.message });
            }
        }
    }
    static async refreshToken(req, res) {
        try {
            const data = auth_validation_1.refreshTokenSchema.parse(req.body);
            const result = await auth_service_1.AuthService.refreshToken(data);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(401).json({ error: error.message });
            }
        }
    }
    static async logout(req, res) {
        try {
            const data = auth_validation_1.logoutSchema.parse(req.body);
            await auth_service_1.AuthService.logout(data);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    static async checkUsername(req, res) {
        try {
            const data = auth_validation_1.checkUsernameSchema.parse(req.query);
            // Wait we actually need to just check suggestions for availability
            const suggestions = await auth_service_1.AuthService.suggestUsernames(data.username);
            // If the exact username they asked for is in suggestions, it's available!
            // But if the first suggestion is NOT exact match, it means it was taken.
            const isAvailable = suggestions[0] === data.username;
            res.status(200).json({
                username: data.username,
                isAvailable,
                suggestions: isAvailable ? [] : suggestions
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map