"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("./wallet.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// All wallet routes require Authentication
router.use(auth_1.authMiddleware);
router.get('/balance', wallet_controller_1.WalletController.getBalance);
router.post('/tip', wallet_controller_1.WalletController.sendTip);
router.get('/transactions', wallet_controller_1.WalletController.getTransactions);
router.get('/exchange-rate', wallet_controller_1.WalletController.getExchangeRate);
// TODO: Add top-up and withdraw logic based on payment SDK endpoints later
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map