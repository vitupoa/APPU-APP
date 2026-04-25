import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { ShopService } from './shop.service.js';
import { ReviewService, WishlistService, CartService, GiftService } from './social-shop.service.js';
import { FlashSaleService, GroupBuyService, DealAlertService } from './deals.service.js';
import { GarageService, ImporterService, LogisticsService, LiveShoppingService, PremiumService, ProductShareService } from './verticals.service.js';
import {
  createProductSchema, updateProductSchema, productFilterSchema,
  createReviewSchema, createWishlistSchema, addWishlistItemSchema,
  addToCartSchema, createFlashSaleSchema, createGroupBuySchema,
  createGarageProfileSchema, createBookingSchema, createImporterProfileSchema,
  createImportRequestSchema, createLiveSessionSchema, createDealAlertSchema,
  createPremiumListingSchema, createProductShareSchema, sendGiftSchema,
  createShippingJobSchema, createLogisticsProfileSchema, createDiscountSchema,
  priceCalculatorSchema, vehicleFavoriteSchema,
} from './shop.types.js';
import { OrderService, DiscountService } from './order.service.js';
import { ShopAnalyticsService } from './analytics.service.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════

// GET /products — Browse with advanced filters
router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const filters = productFilterSchema.parse(req.query);
    const result = await ShopService.listProducts(filters);
    res.json(result);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 500).json({ error: e.message });
  }
});

// GET /products/trending
router.get('/products/trending', async (_req: AuthRequest, res: Response) => {
  try {
    const products = await ShopService.getTrendingProducts();
    res.json(products);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /products/mine
router.get('/products/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const products = await ShopService.getMyProducts(req.userId!);
    res.json(products);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /categories
router.get('/categories', async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await ShopService.getCategories();
    res.json(categories);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /products/:id
router.get('/products/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await ShopService.getProduct(productId, req.userId);
    res.json(product);
  } catch (e: any) { res.status(404).json({ error: 'Product not found' }); }
});

// POST /products
router.post('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await ShopService.createProduct(req.userId!, data);
    res.status(201).json(product);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 400).json({ error: e.message, details: e.errors });
  }
});

// PUT /products/:id
router.put('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await ShopService.updateProduct(productId, req.userId!, data);
    res.json(product);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 400).json({ error: e.message });
  }
});

// DELETE /products/:id
router.delete('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await ShopService.deleteProduct(productId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// SPARE PARTS COMPATIBILITY
// ═══════════════════════════════════════════════════════════

router.get('/parts/compatible', async (req: AuthRequest, res: Response) => {
  try {
    const { make, model, year, partType } = req.query;
    if (!make) {
      res.status(400).json({ error: 'make is required' });
      return;
    }
    const parts = await ShopService.findCompatibleParts({
      make: make as string,
      model: model as string,
      year: year ? parseInt(year as string) : undefined,
      partType: partType as string,
    });
    res.json(parts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════

router.get('/products/:id/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await ReviewService.getProductReviews(productId, cursor, limit);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReviewSchema.parse(req.body);
    const review = await ReviewService.createReview(req.userId!, data);
    res.status(201).json(review);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 400).json({ error: e.message });
  }
});

router.delete('/reviews/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await ReviewService.deleteReview(reviewId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// WISHLISTS
// ═══════════════════════════════════════════════════════════

router.get('/wishlists', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const wishlists = await WishlistService.getUserWishlists(req.userId!);
    res.json(wishlists);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/wishlists/public/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const wishlists = await WishlistService.getPublicWishlists(userId);
    res.json(wishlists);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/wishlists', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createWishlistSchema.parse(req.body);
    const wishlist = await WishlistService.createWishlist(req.userId!, data);
    res.status(201).json(wishlist);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 400).json({ error: e.message });
  }
});

router.post('/wishlists/:id/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const wishlistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = addWishlistItemSchema.parse(req.body);
    const item = await WishlistService.addItem(wishlistId, req.userId!, data);
    res.status(201).json(item);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/wishlists/:id/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const wishlistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    await WishlistService.removeItem(wishlistId, itemId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/wishlists/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const wishlistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await WishlistService.deleteWishlist(wishlistId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════

router.get('/cart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await CartService.getCart(req.userId!);
    res.json(cart);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = addToCartSchema.parse(req.body);
    const item = await CartService.addToCart(req.userId!, data);
    res.status(201).json(item);
  } catch (e: any) {
    res.status(e.name === 'ZodError' ? 400 : 400).json({ error: e.message });
  }
});

router.delete('/cart/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    await CartService.removeFromCart(req.userId!, productId);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/cart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await CartService.clearCart(req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// GIFTS
// ═══════════════════════════════════════════════════════════

router.post('/gifts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = sendGiftSchema.parse(req.body);
    const gift = await GiftService.sendGift(req.userId!, data);
    res.status(201).json(gift);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/gifts/received', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const gifts = await GiftService.getReceivedGifts(req.userId!);
    res.json(gifts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/gifts/sent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const gifts = await GiftService.getSentGifts(req.userId!);
    res.json(gifts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// FLASH SALES
// ═══════════════════════════════════════════════════════════

router.get('/flash-sales/active', async (_req: AuthRequest, res: Response) => {
  try {
    const sales = await FlashSaleService.getActiveFlashSales();
    res.json(sales);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/flash-sales/upcoming', async (_req: AuthRequest, res: Response) => {
  try {
    const sales = await FlashSaleService.getUpcomingFlashSales();
    res.json(sales);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/flash-sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createFlashSaleSchema.parse(req.body);
    const sale = await FlashSaleService.createFlashSale(data);
    res.status(201).json(sale);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// GROUP BUYS
// ═══════════════════════════════════════════════════════════

router.get('/group-buys', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await GroupBuyService.getActiveGroupBuys(cursor, limit);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/group-buys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createGroupBuySchema.parse(req.body);
    const gb = await GroupBuyService.createGroupBuy(req.userId!, data);
    res.status(201).json(gb);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/group-buys/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const groupBuyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await GroupBuyService.joinGroupBuy(groupBuyId, req.userId!);
    res.json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// DEAL ALERTS
// ═══════════════════════════════════════════════════════════

router.get('/deal-alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await DealAlertService.getUserAlerts(req.userId!);
    res.json(alerts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/deal-alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createDealAlertSchema.parse(req.body);
    const alert = await DealAlertService.createAlert(req.userId!, data);
    res.status(201).json(alert);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/deal-alerts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await DealAlertService.deleteAlert(alertId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// GARAGES
// ═══════════════════════════════════════════════════════════

router.get('/garages', async (req: AuthRequest, res: Response) => {
  try {
    const result = await GarageService.listGarages({
      location: req.query.location as string,
      serviceType: req.query.serviceType as string,
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/garages/:id', async (req: AuthRequest, res: Response) => {
  try {
    const garageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const garage = await GarageService.getProfile(garageId);
    res.json(garage);
  } catch (e: any) { res.status(404).json({ error: 'Garage not found' }); }
});

router.post('/garages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createGarageProfileSchema.parse(req.body);
    const profile = await GarageService.createProfile(req.userId!, data);
    res.status(201).json(profile);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/garages/bookings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const booking = await GarageService.createBooking(req.userId!, data);
    res.status(201).json(booking);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/garages/bookings/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await GarageService.getUserBookings(req.userId!);
    res.json(bookings);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/garages/bookings/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const booking = await GarageService.updateBookingStatus(bookingId, req.userId!, req.body.status);
    res.json(booking);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/garages/:id/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const garageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const review = await GarageService.createReview(req.userId!, {
      garageId, rating: req.body.rating, text: req.body.text
    });
    res.status(201).json(review);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// IMPORTERS
// ═══════════════════════════════════════════════════════════

router.get('/importers', async (req: AuthRequest, res: Response) => {
  try {
    const result = await ImporterService.listImporters({
      country: req.query.country as string,
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/importers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createImporterProfileSchema.parse(req.body);
    const profile = await ImporterService.createProfile(req.userId!, data);
    res.status(201).json(profile);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/import-requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createImportRequestSchema.parse(req.body);
    const request = await ImporterService.createImportRequest(req.userId!, data);
    res.status(201).json(request);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/import-requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ImporterService.getImportRequests(req.userId!);
    res.json(requests);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/import-requests/:id/quotes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const quote = await ImporterService.submitQuote(req.userId!, {
      requestId, ...req.body
    });
    res.status(201).json(quote);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/import-requests/:id/accept/:quoteId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const quoteId = Array.isArray(req.params.quoteId) ? req.params.quoteId[0] : req.params.quoteId;
    const result = await ImporterService.acceptQuote(requestId, quoteId, req.userId!);
    res.json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// LOGISTICS
// ═══════════════════════════════════════════════════════════

router.post('/logistics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createLogisticsProfileSchema.parse(req.body);
    const profile = await LogisticsService.createProfile(req.userId!, data);
    res.status(201).json(profile);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/logistics', async (req: AuthRequest, res: Response) => {
  try {
    const result = await LogisticsService.listCompanies({
      area: req.query.area as string,
      serviceType: req.query.serviceType as string,
    });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/shipping-jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createShippingJobSchema.parse(req.body);
    const job = await LogisticsService.createShippingJob(req.userId!, data);
    res.status(201).json(job);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// LIVE SHOPPING
// ═══════════════════════════════════════════════════════════

router.get('/live-sessions/active', async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await LiveShoppingService.getActiveSessions();
    res.json(sessions);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/live-sessions/upcoming', async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await LiveShoppingService.getUpcomingSessions();
    res.json(sessions);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/live-sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createLiveSessionSchema.parse(req.body);
    const session = await LiveShoppingService.createSession(req.userId!, data);
    res.status(201).json(session);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/live-sessions/:id/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await LiveShoppingService.startSession(sessionId, req.userId!);
    res.json(session);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/live-sessions/:id/end', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await LiveShoppingService.endSession(sessionId, req.userId!);
    res.json(session);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// PREMIUM LISTINGS
// ═══════════════════════════════════════════════════════════

router.post('/premium-listings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createPremiumListingSchema.parse(req.body);
    const result = await PremiumService.createListing(req.userId!, data);
    res.status(201).json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// SOCIAL SHOPPING
// ═══════════════════════════════════════════════════════════

router.post('/shares', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createProductShareSchema.parse(req.body);
    const share = await ProductShareService.shareProduct(req.userId!, data);
    res.status(201).json(share);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/tags', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tag = await ProductShareService.tagProduct(req.body);
    res.status(201).json(tag);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/tags/:contentType/:contentId', async (req: AuthRequest, res: Response) => {
  try {
    const contentId = Array.isArray(req.params.contentId) ? req.params.contentId[0] : req.params.contentId;
    const contentType = Array.isArray(req.params.contentType) ? req.params.contentType[0] : req.params.contentType;
    const tags = await ProductShareService.getProductTags(contentId, contentType);
    res.json(tags);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// DISCOUNTS
// ═══════════════════════════════════════════════════════════

router.post('/products/:id/discounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createDiscountSchema.parse(req.body);
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const discount = await DiscountService.createDiscount(req.userId!, productId, data);
    res.status(201).json(discount);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/products/:id/discounts', async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const discounts = await DiscountService.getProductDiscounts(productId);
    res.json(discounts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/discounts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const discountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await DiscountService.deleteDiscount(discountId, req.userId!);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════

router.post('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.userId!, req.body.notes);
    res.status(201).json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await OrderService.getMyOrders(req.userId!, cursor, limit);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/seller', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await OrderService.getSellerOrders(req.userId!, cursor, limit);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await OrderService.getOrder(orderId, req.userId!);
    res.json(order);
  } catch (e: any) { res.status(404).json({ error: 'Order not found' }); }
});

router.patch('/orders/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await OrderService.updateOrderStatus(orderId, req.userId!, req.body.status);
    res.json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/orders/:orderId/items/:itemId/confirm-delivery', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    const result = await OrderService.confirmDelivery(orderId, itemId, req.userId!);
    res.json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════

router.get('/analytics/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const analytics = await ShopAnalyticsService.getProductAnalytics(productId, days);
    res.json(analytics);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/analytics/seller', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const analytics = await ShopAnalyticsService.getSellerAnalytics(req.userId!, days);
    res.json(analytics);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/analytics/categories', async (_req: AuthRequest, res: Response) => {
  try {
    const analytics = await ShopAnalyticsService.getCategoryAnalytics();
    res.json(analytics);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// VEHICLE FAVORITES
// ═══════════════════════════════════════════════════════════

router.post('/vehicles/favorites', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = vehicleFavoriteSchema.parse(req.body);
    const favorite = await ShopService.addVehicleFavorite(req.userId!, data.productId);
    res.status(201).json(favorite);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/vehicles/favorites/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    await ShopService.removeVehicleFavorite(req.userId!, productId);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/vehicles/favorites', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await ShopService.getVehicleFavorites(req.userId!);
    res.json(favorites);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// PRICE CALCULATOR
// ═══════════════════════════════════════════════════════════

router.post('/calculator/import-cost', async (req: AuthRequest, res: Response) => {
  try {
    const data = priceCalculatorSchema.parse(req.body);
    const result = await ShopService.calculateImportCost(data);
    res.json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// SOCIAL PROOF
// ═══════════════════════════════════════════════════════════

router.get('/products/:id/friends-bought', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const friends = await ShopService.getFriendsWhoBought(req.userId!, productId);
    res.json(friends);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/recommendations/friends', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const products = await ShopService.getFriendRecommendations(req.userId!, limit);
    res.json(products);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
