"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', auth_controller_1.AuthController.register);
router.post('/login', auth_controller_1.AuthController.login);
router.post('/oauth/login', auth_controller_1.AuthController.oauthLogin);
router.post('/refresh', auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_controller_1.AuthController.logout);
// Optional: check username availability during typing
router.get('/check-username', auth_controller_1.AuthController.checkUsername);
// Protected routes (for future auth-dependent things like verifying OTP from authenticated state)
// router.post('/verify-otp', authMiddleware, AuthController.verifyOtp);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map