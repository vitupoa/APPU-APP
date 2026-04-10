"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const shop_service_1 = require("./shop.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createProductSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().max(2000).optional(),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).min(1).max(10),
    priceKr: zod_1.z.number().positive('Price must be positive'),
    category: zod_1.z.string().max(50).optional(),
    whatsappNumber: zod_1.z.string().min(7).max(20)
});
const updateProductSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200).optional(),
    description: zod_1.z.string().max(2000).optional(),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).min(1).max(10).optional(),
    priceKr: zod_1.z.number().positive().optional(),
    category: zod_1.z.string().max(50).optional(),
    whatsappNumber: zod_1.z.string().min(7).max(20).optional(),
    status: zod_1.z.enum(['active', 'sold']).optional()
});
// GET /api/v1/shop/products — Public browsing
router.get('/products', async (req, res) => {
    try {
        const category = req.query.category;
        const query = req.query.q;
        const sellerId = req.query.sellerId;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await shop_service_1.ShopService.listProducts({ category, sellerId, query, cursor, limit });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/shop/products/mine — Seller's own products
router.get('/products/mine', auth_1.authMiddleware, async (req, res) => {
    try {
        const products = await shop_service_1.ShopService.getMyProducts(req.userId);
        res.status(200).json(products);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/shop/products/:id — Single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await shop_service_1.ShopService.getProduct(String(req.params.id));
        res.status(200).json(product);
    }
    catch (error) {
        res.status(404).json({ error: 'Product not found' });
    }
});
// POST /api/v1/shop/products — Create product
router.post('/products', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = createProductSchema.parse(req.body);
        const product = await shop_service_1.ShopService.createProduct({
            sellerId: req.userId,
            ...data
        });
        res.status(201).json(product);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
});
// PUT /api/v1/shop/products/:id — Update product
router.put('/products/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = updateProductSchema.parse(req.body);
        const product = await shop_service_1.ShopService.updateProduct(String(req.params.id), req.userId, data);
        res.status(200).json(product);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
});
// DELETE /api/v1/shop/products/:id — Soft delete
router.delete('/products/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await shop_service_1.ShopService.deleteProduct(String(req.params.id), req.userId);
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=shop.routes.js.map