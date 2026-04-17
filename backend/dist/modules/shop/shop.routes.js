import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { ShopService } from './shop.service.js';
import { z } from 'zod';
const router = Router();
const createProductSchema = z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    imageUrls: z.array(z.string().url()).min(1).max(10),
    priceKr: z.number().positive('Price must be positive'),
    category: z.string().max(50).optional(),
    whatsappNumber: z.string().min(7).max(20)
});
const updateProductSchema = z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    imageUrls: z.array(z.string().url()).min(1).max(10).optional(),
    priceKr: z.number().positive().optional(),
    category: z.string().max(50).optional(),
    whatsappNumber: z.string().min(7).max(20).optional(),
    status: z.enum(['active', 'sold']).optional()
});
// GET /api/v1/shop/products — Public browsing
router.get('/products', async (req, res) => {
    try {
        const category = req.query.category;
        const query = req.query.q;
        const sellerId = req.query.sellerId;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await ShopService.listProducts({ category, sellerId, query, cursor, limit });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/shop/products/mine — Seller's own products
router.get('/products/mine', authMiddleware, async (req, res) => {
    try {
        const products = await ShopService.getMyProducts(req.userId);
        res.status(200).json(products);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/shop/products/:id — Single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await ShopService.getProduct(String(req.params.id));
        res.status(200).json(product);
    }
    catch (error) {
        res.status(404).json({ error: 'Product not found' });
    }
});
// POST /api/v1/shop/products — Create product
router.post('/products', authMiddleware, async (req, res) => {
    try {
        const data = createProductSchema.parse(req.body);
        const product = await ShopService.createProduct({
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
router.put('/products/:id', authMiddleware, async (req, res) => {
    try {
        const data = updateProductSchema.parse(req.body);
        const product = await ShopService.updateProduct(String(req.params.id), req.userId, data);
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
router.delete('/products/:id', authMiddleware, async (req, res) => {
    try {
        await ShopService.deleteProduct(String(req.params.id), req.userId);
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=shop.routes.js.map