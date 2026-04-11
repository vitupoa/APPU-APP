"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cache_controller_1 = require("./cache.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Require authorization for all cache endpoints so mobile clients 
// need a valid token to interact with remote Redis caching
router.use(auth_1.authMiddleware);
router.get('/:key', cache_controller_1.getCacheValue);
router.post('/', cache_controller_1.setCacheValue);
router.delete('/:key', cache_controller_1.deleteCacheValue);
exports.default = router;
//# sourceMappingURL=cache.routes.js.map