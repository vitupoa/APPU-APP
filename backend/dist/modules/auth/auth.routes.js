import { Router } from 'express';
import { AuthController } from './auth.controller.js';
const router = Router();
// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/oauth/login', AuthController.oauthLogin);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
// Optional: check username availability during typing
router.get('/check-username', AuthController.checkUsername);
// Protected routes (for future auth-dependent things like verifying OTP from authenticated state)
// router.post('/verify-otp', authMiddleware, AuthController.verifyOtp);
export default router;
//# sourceMappingURL=auth.routes.js.map