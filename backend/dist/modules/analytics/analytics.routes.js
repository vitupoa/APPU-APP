"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const analytics_service_1 = require("./analytics.service");
const router = (0, express_1.Router)();
// GET /api/v1/analytics — Creator analytics dashboard data
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const analytics = await analytics_service_1.AnalyticsService.getCreatorAnalytics(req.userId, { days });
        res.status(200).json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map