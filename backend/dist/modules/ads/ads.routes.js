"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const ads_service_1 = require("./ads.service");
const router = (0, express_1.Router)();
// POST /api/v1/ads/rewarded — Credit user for watching rewarded ad
router.post('/rewarded', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await ads_service_1.AdsService.creditRewardedAd(req.userId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/v1/ads/impression — Record ad impression (analytics)
router.post('/impression', auth_1.authMiddleware, async (req, res) => {
    try {
        const { adUnitId, adType, placement } = req.body;
        await ads_service_1.AdsService.recordImpression({
            userId: req.userId,
            adUnitId,
            adType,
            placement
        });
        res.status(200).json({ recorded: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=ads.routes.js.map