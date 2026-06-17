import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { categoryDetailSchemas } from './shop.types.js';
import { io } from '../../index.js';
import { emitProductCreated, emitProductUpdated, emitProductDeleted } from '../../shared/gateway/shop-socket.js';
import { listingFeeService } from './listing-fee.service.js';
import crypto from 'crypto';

const SELLER_SELECT = {
  id: true, username: true, display_name: true, avatar_url: true, is_verified: true
};

// ─── PRODUCT CRUD (LISTING-ONLY MODEL - Wave 3 Task 7.2) ───────────────────────────────────────
// Shop operates as listing-only platform. No payment processing or escrow.
// Buyers contact sellers directly via WhatsApp or external purchase URLs.

export class ShopService {

  static async createProduct(sellerId: string, data: any) {
    const { categoryDetails, ...productData } = data;

    // Validate category-specific details
    if (categoryDetails && categoryDetailSchemas[data.category]) {
      categoryDetailSchemas[data.category].parse(categoryDetails);
    }

    // Get user country for listing fee calculation
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sellerId }, select: { country: true } });
    
    // Calculate listing fee
    const { fee, isFree } = await listingFeeService.calculateListingFee(
      sellerId,
      productData.category || 'OTHER',
      user.country
    );

    // Check if user has sufficient balance (if fee required)
    if (!isFree && fee > 0) {
      const wallet = await prisma.wallets.findUnique({ where: { user_id: sellerId } });
      const walletBalance = wallet?.kr_balance;
      const balanceNum = typeof walletBalance === 'number' ? walletBalance : Number(walletBalance || 0);
      if (!wallet || balanceNum < fee) {
        throw new Error(`Insufficient balance. Listing fee: ${fee} KR`);
      }
    }

    const product = await prisma.$transaction(async (tx: any) => {
      const p = await tx.products.create({
        data: {
          id: crypto.randomUUID(),
          seller_id: sellerId,
          title: productData.title,
          description: productData.description,
          image_urls: productData.imageUrls,
          price_kr: new Prisma.Decimal(productData.priceKr),
          currency: productData.currency,
          local_price: productData.localPrice ? new Prisma.Decimal(productData.localPrice) : undefined,
          wholesale_price: productData.wholesalePrice ? new Prisma.Decimal(productData.wholesalePrice) : undefined,
          wholesale_min_qty: productData.wholesaleMinQty,
          bargain_enabled: productData.bargainEnabled || false,
          bargain_min_price: productData.bargainMinPrice ? new Prisma.Decimal(productData.bargainMinPrice) : undefined,
          category: productData.category || 'OTHER',
          subcategory: productData.subcategory,
          condition: productData.condition || 'NEW',
          brand: productData.brand,
          tags: productData.tags || [],
          whatsapp_number: productData.whatsappNumber,
          purchase_url: productData.purchaseUrl,
          contactMethod: productData.contactMethod || 'WHATSAPP',
          location: productData.location,
          latitude: productData.latitude ? new Prisma.Decimal(productData.latitude) : undefined,
          longitude: productData.longitude ? new Prisma.Decimal(productData.longitude) : undefined,
          stock: productData.stock ?? 1,
          status: 'active',
          updated_at: new Date(),
        },
        include: { user: { select: SELLER_SELECT } }
      });

      // Create category-specific detail record
      if (categoryDetails) {
        await createCategoryDetail(tx, p.id, productData.category, categoryDetails);
      }

      // Charge listing fee
      await listingFeeService.chargeListingFee(sellerId, p.id, productData.category || 'OTHER', user.country);

      return p;
    });

    // Re-fetch with all details included
    const fullProduct = await this.getProduct(product.id);
    
    // Emit real-time event
    emitProductCreated(io, fullProduct);
    
    return fullProduct;
  }

  static async updateProduct(productId: string, sellerId: string, data: any) {
    const existing = await prisma.products.findUniqueOrThrow({ where: { id: productId } });
    if (existing.seller_id !== sellerId) throw new Error('You can only edit your own products');

    const { categoryDetails, ...updates } = data;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.imageUrls !== undefined) updateData.image_urls = updates.imageUrls;
    if (updates.priceKr !== undefined) updateData.price_kr = new Prisma.Decimal(updates.priceKr);
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.localPrice !== undefined) updateData.local_price = new Prisma.Decimal(updates.localPrice);
    if (updates.wholesalePrice !== undefined) updateData.wholesale_price = new Prisma.Decimal(updates.wholesalePrice);
    if (updates.wholesaleMinQty !== undefined) updateData.wholesale_min_qty = updates.wholesaleMinQty;
    if (updates.bargainEnabled !== undefined) updateData.bargain_enabled = updates.bargainEnabled;
    if (updates.bargainMinPrice !== undefined) updateData.bargain_min_price = new Prisma.Decimal(updates.bargainMinPrice);
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
    if (updates.condition !== undefined) updateData.condition = updates.condition;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.whatsappNumber !== undefined) updateData.whatsapp_number = updates.whatsappNumber;
    if (updates.purchaseUrl !== undefined) updateData.purchase_url = updates.purchaseUrl;
    if (updates.contactMethod !== undefined) updateData.contactMethod = updates.contactMethod;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.latitude !== undefined) updateData.latitude = new Prisma.Decimal(updates.latitude);
    if (updates.longitude !== undefined) updateData.longitude = new Prisma.Decimal(updates.longitude);
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.status !== undefined) updateData.status = updates.status;

    await prisma.$transaction(async (tx: any) => {
      await tx.products.update({ where: { id: productId }, data: updateData });

      if (categoryDetails) {
        const cat = updates.category || existing.category;
        await upsertCategoryDetail(tx, productId, cat as string, categoryDetails);
      }
    });

    const updatedProduct = await this.getProduct(productId);
    
    // Emit real-time event
    emitProductUpdated(io, updatedProduct);
    
    return updatedProduct;
  }

  static async deleteProduct(productId: string, sellerId: string) {
    const existing = await prisma.products.findUniqueOrThrow({ where: { id: productId } });
    if (existing.seller_id !== sellerId) throw new Error('You can only delete your own products');
    await prisma.products.update({ where: { id: productId }, data: { status: 'removed' } });
    
    // Emit real-time event
    emitProductDeleted(io, productId);
  }

  static async getProduct(productId: string, viewerId?: string) {
    const includeQuery: Prisma.productsInclude = {
      user: { select: SELLER_SELECT },
      vehicle_details: true,
      spare_part_details: true,
      real_estate_details: true,
      fashion_details: true,
      shoe_details: true,
      electronics_details: true,
      furniture_details: true,
      food_details: true,
      grocery_details: true,
      book_details: true,
      digital_product_details: true,
      service_details: true,
      product_discounts: { where: { is_active: true, end_date: { gte: new Date() } } },
    };

    const product = await prisma.products.findUniqueOrThrow({
      where: { id: productId },
      include: includeQuery
    });

    // Increment view count
    await prisma.products.update({
      where: { id: productId },
      data: { view_count: { increment: 1 } }
    });

    return formatProduct(product);
  }

  static async listProducts(params: {
    category?: string; subcategory?: string; q?: string; sellerId?: string;
    condition?: string; minPrice?: number; maxPrice?: number; location?: string;
    brand?: string; bodyType?: string; make?: string; model?: string;
    yearFrom?: number; yearTo?: number; mileageMax?: number; fuelType?: string;
    transmission?: string; partType?: string; compatibleMake?: string;
    propertyType?: string; listingType?: string; bedroomsMin?: number; bathroomsMin?: number;
    size?: string; color?: string; gender?: string;
    cursor?: string; limit?: number; sortBy?: string;
  }) {
    const limit = params.limit || 20;
    const where: Prisma.productsWhereInput = { status: 'active' };

    // Global filters
    if (params.category) where.category = params.category as any;
    if (params.subcategory) where.subcategory = params.subcategory;
    if (params.sellerId) where.seller_id = params.sellerId;
    if (params.condition) where.condition = params.condition as any;
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' };
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };

    if (params.minPrice || params.maxPrice) {
      where.price_kr = {};
      if (params.minPrice) where.price_kr.gte = params.minPrice;
      if (params.maxPrice) where.price_kr.lte = params.maxPrice;
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
        { tags: { has: params.q.toLowerCase() } },
      ];
    }

    // Vehicle-specific filters
    if (params.make || params.model || params.bodyType || params.yearFrom || params.yearTo || params.mileageMax || params.fuelType || params.transmission) {
      const vWhere: any = {};
      if (params.make) vWhere.make = { contains: params.make, mode: 'insensitive' };
      if (params.model) vWhere.model = { contains: params.model, mode: 'insensitive' };
      if (params.bodyType) vWhere.body_type = params.bodyType as any;
      if (params.fuelType) vWhere.fuel_type = params.fuelType as any;
      if (params.transmission) vWhere.transmission = params.transmission as any;
      if (params.yearFrom || params.yearTo) {
        vWhere.year = {};
        if (params.yearFrom) vWhere.year.gte = params.yearFrom;
        if (params.yearTo) vWhere.year.lte = params.yearTo;
      }
      if (params.mileageMax) vWhere.mileage = { lte: params.mileageMax };
      where.vehicle_details = vWhere;
    }

    // Spare parts filters
    if (params.partType || params.compatibleMake) {
      const spWhere: any = {};
      if (params.partType) spWhere.part_type = params.partType;
      if (params.compatibleMake) spWhere.compatible_makes = { has: params.compatibleMake };
      where.spare_part_details = spWhere;
    }

    // Real estate filters
    if (params.propertyType || params.listingType || params.bedroomsMin || params.bathroomsMin) {
      const reWhere: any = {};
      if (params.propertyType) reWhere.property_type = params.propertyType;
      if (params.listingType) reWhere.listing_type = params.listingType;
      if (params.bedroomsMin) reWhere.bedrooms = { gte: params.bedroomsMin };
      if (params.bathroomsMin) reWhere.bathrooms = { gte: params.bathroomsMin };
      where.real_estate_details = reWhere;
    }

    // Fashion/shoe filters
    if (params.size || params.color || params.gender) {
      if (params.category === 'SHOES') {
        const shWhere: any = {};
        if (params.size) shWhere.shoe_size = params.size;
        if (params.gender) shWhere.gender = params.gender;
        where.shoe_details = shWhere;
      } else {
        const fWhere: any = {};
        if (params.size) fWhere.size = params.size;
        if (params.gender) fWhere.gender = params.gender;
        if (params.color) fWhere.color_variants = { has: params.color };
        where.fashion_details = fWhere;
      }
    }

    // Sort order
    let orderBy: Prisma.productsOrderByWithRelationInput | Prisma.productsOrderByWithRelationInput[] = { created_at: 'desc' };
    switch (params.sortBy) {
      case 'price_asc': orderBy = { price_kr: 'asc' }; break;
      case 'price_desc': orderBy = { price_kr: 'desc' }; break;
      case 'popular': orderBy = { view_count: 'desc' }; break;
      case 'rating': orderBy = { avg_rating: 'desc' }; break;
    }

    const includeQuery: Prisma.productsInclude = {
      user: { select: SELLER_SELECT },
      vehicle_details: true,
      spare_part_details: true,
      real_estate_details: true,
      fashion_details: true,
      shoe_details: true,
      electronics_details: true,
      furniture_details: true,
      food_details: true,
      grocery_details: true,
      book_details: true,
      digital_product_details: true,
      service_details: true,
    };

    // Featured/promoted products first
    const products = await prisma.products.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: [{ is_top_spot: 'desc' }, { is_promoted: 'desc' }, { is_featured: 'desc' }, orderBy],
      include: includeQuery
    });

    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, limit) : products;

    return {
      items: items.map(formatProduct),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async getMyProducts(sellerId: string) {
    const products = await prisma.products.findMany({
      where: { seller_id: sellerId, status: { not: 'removed' } },
      orderBy: { created_at: 'desc' },
      include: { user: { select: SELLER_SELECT },
        vehicle_details: true,
        spare_part_details: true,
      }
    });
    return products.map(formatProduct);
  }

  static async getProductsByCategory(category: string, cursor?: string, limit = 20) {
    return this.listProducts({ category, cursor, limit });
  }

  static async getTrendingProducts(limit = 20) {
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      orderBy: [{ view_count: 'desc' }, { sales_count: 'desc' }],
      take: limit,
      include: { user: { select: SELLER_SELECT } }
    });
    return products.map(formatProduct);
  }

  static async getCategories() {
    const counts = await prisma.products.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: true,
    });
    return counts.map((c: any) => ({ category: c.category, count: c._count }));
  }

  // ─── VEHICLE FAVORITES ─────────────────────────────────

  static async addVehicleFavorite(userId: string, productId: string) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: productId } });
    if (product.category !== 'VEHICLES') throw new Error('Only vehicles can be favorited');

    return prisma.vehicle_favorites.create({
      data: { user_id: userId, product_id: productId },
      include: { products: { include: { user: { select: SELLER_SELECT }, vehicle_details: true } } }
    });
  }

  static async removeVehicleFavorite(userId: string, productId: string) {
    await prisma.vehicle_favorites.deleteMany({ where: { user_id: userId, product_id: productId } });
  }

  static async getVehicleFavorites(userId: string) {
    const favorites = await prisma.vehicle_favorites.findMany({
      where: { user_id: userId },
      include: { products: { include: { user: { select: SELLER_SELECT }, vehicle_details: true } } },
      orderBy: { created_at: 'desc' }
    });
    return favorites.map((f: any) => ({
      id: f.id,
      created_at: f.created_at.toISOString(),
      product: formatProduct(f.products),
    }));
  }

  // ─── PRICE CALCULATOR ──────────────────────────────────

  static async calculateImportCost(params: {
    vehiclePriceUsd: number;
    destinationCountry: string;
    port?: string;
    engineCc?: number;
    yearOfManufacture?: number;
  }) {
    const { vehiclePriceUsd, destinationCountry, engineCc, yearOfManufacture } = params;

    // Simplified import cost calculation (real-world would be more complex)
    const rates: Record<string, { duty: number; vat: number; excise: number; shipping: number }> = {
      KE: { duty: 0.25, vat: 0.16, excise: 0.20, shipping: 1500 },
      TZ: { duty: 0.25, vat: 0.18, excise: 0.10, shipping: 1400 },
      UG: { duty: 0.25, vat: 0.18, excise: 0.15, shipping: 1600 },
      RW: { duty: 0.25, vat: 0.18, excise: 0.10, shipping: 1800 },
    };

    const rate = rates[destinationCountry];
    if (!rate) throw new Error('Unsupported destination country');

    const cif = vehiclePriceUsd + rate.shipping; // Cost, Insurance, Freight
    const duty = cif * rate.duty;
    const excise = (cif + duty) * rate.excise;
    const vat = (cif + duty + excise) * rate.vat;
    const totalCost = cif + duty + excise + vat;

    // Additional fees
    const portCharges = 200;
    const clearingFees = 300;
    const registrationFees = destinationCountry === 'KE' ? 500 : 400;

    const grandTotal = totalCost + portCharges + clearingFees + registrationFees;

    return {
      vehiclePriceUsd,
      destinationCountry,
      breakdown: {
        cif,
        duty,
        excise,
        vat,
        portCharges,
        clearingFees,
        registrationFees,
      },
      totalCostUsd: Math.round(grandTotal * 100) / 100,
      estimatedKr: Math.round(grandTotal * 130 * 100) / 100, // Assuming 1 USD = 130 KES
    };
  }

  // ─── SOCIAL PROOF ──────────────────────────────────────

  static async getFriendsWhoBought(userId: string, productId: string) {
    // Get user's friends (admirers who are mutual)
    const admirers = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true }
    });
    const friendIds = admirers.map((a: any) => a.admired_id);

    // Find orders containing this product from friends
    const orderItems = await prisma.order_items.findMany({
      where: {
        product_id: productId,
        orders: { buyer_id: { in: friendIds } }
      },
      include: {
        orders: {
          select: {
            User: { select: { id: true, username: true, display_name: true, avatar_url: true } },
            created_at: true
          }
        }
      },
      distinct: ['order_id'],
      take: 10
    });

    return orderItems.map((item: any) => ({
      user: item.orders.user,
      purchasedAt: item.orders.created_at.toISOString(),
    }));
  }

  static async getFriendRecommendations(userId: string, limit = 20) {
    // Get user's friends
    const admirers = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true }
    });
    const friendIds = admirers.map((a: any) => a.admired_id);

    if (!friendIds.length) return [];

    // Find products purchased by friends
    const orderItems = await prisma.order_items.findMany({
      where: {
        orders: { buyer_id: { in: friendIds } },
        products: { status: 'active' }
      },
      include: {
        products: {
          include: { user: { select: SELLER_SELECT },
            vehicle_details: true,
            fashion_details: true,
          }
        }
      },
      orderBy: { orders: { created_at: 'desc' } },
      take: limit * 2, // Get more to dedupe
    });

    // Deduplicate by product ID
    const seen = new Set<string>();
    const unique = orderItems.filter((item: any) => {
      if (seen.has(item.product_id)) return false;
      seen.add(item.product_id);
      return true;
    }).slice(0, limit);

    return unique.map((item: any) => formatProduct(item.products));
  }

  // ─── SPARE PARTS COMPATIBILITY ─────────────────────────

  static async findCompatibleParts(params: { make: string; model?: string; year?: number; partType?: string }) {
    const where: any = {
      products: { status: 'active' },
      compatible_makes: { has: params.make },
    };
    if (params.model) where.compatible_models = { has: params.model };
    if (params.partType) where.part_type = params.partType;

    const parts = await prisma.spare_part_details.findMany({
      where,
      include: {
        products: { include: { user: { select: SELLER_SELECT } } }
      }
    });

    // Filter by year range if provided
    const filtered = params.year
      ? parts.filter((p: any) => {
          if (p.compatible_year_from && p.compatible_year_to) {
            return params.year! >= p.compatible_year_from && params.year! <= p.compatible_year_to;
          }
          return true;
        })
      : parts;

    return filtered.map((p: any) => ({
      ...formatProduct(p.products),
      sparePartDetail: formatDetail(p),
    }));
  }
}

// ─── HELPERS ────────────────────────────────────────────

async function createCategoryDetail(tx: any, product_id: string, category: string, details: any) {
  const map: Record<string, string> = {
    VEHICLES: 'vehicle_details', SPARE_PARTS: 'spare_part_details',
    REAL_ESTATE: 'real_estate_details', FASHION: 'fashion_details',
    SHOES: 'shoe_details', ELECTRONICS: 'electronics_details', FURNITURE: 'furniture_details',
    FOOD_FMCG: 'food_details', GROCERIES: 'grocery_details', BOOKS: 'book_details',
    DIGITAL_PRODUCTS: 'digital_product_details', SERVICES: 'service_details',
  };
  const model = map[category];
  if (!model) return;

  const data = { product_id, ...details };
  if (details.expiryDate) data.expiryDate = new Date(details.expiryDate);
  if (details.fileSizeMb) data.fileSizeMb = new Prisma.Decimal(details.fileSizeMb);

  await (tx as any)[model].create({ data });
}

async function upsertCategoryDetail(tx: any, product_id: string, category: string, details: any) {
  const map: Record<string, string> = {
    VEHICLES: 'vehicle_details', SPARE_PARTS: 'spare_part_details',
    REAL_ESTATE: 'real_estate_details', FASHION: 'fashion_details',
    SHOES: 'shoe_details', ELECTRONICS: 'electronics_details', FURNITURE: 'furniture_details',
    FOOD_FMCG: 'food_details', GROCERIES: 'grocery_details', BOOKS: 'book_details',
    DIGITAL_PRODUCTS: 'digital_product_details', SERVICES: 'service_details',
  };
  const model = map[category];
  if (!model) return;

  const existing = await (tx as any)[model].findUnique({ where: { product_id } });
  const data = { ...details };
  if (details.expiryDate) data.expiryDate = new Date(details.expiryDate);
  if (details.fileSizeMb) data.fileSizeMb = new Prisma.Decimal(details.fileSizeMb);

  if (existing) {
    await (tx as any)[model].update({ where: { product_id }, data });
  } else {
    await (tx as any)[model].create({ data: { product_id, ...data } });
  }
}

function formatProduct(p: any) {
  const result: any = {
    id: p.id,
    seller: p.user,
    title: p.title,
    description: p.description,
    imageUrls: p.image_urls,
    priceKr: Number(p.price_kr),
    currency: p.currency,
    localPrice: p.local_price ? Number(p.local_price) : null,
    wholesalePrice: p.wholesale_price ? Number(p.wholesale_price) : null,
    wholesaleMinQty: p.wholesale_min_qty,
    bargainEnabled: p.bargain_enabled,
    bargainMinPrice: p.bargain_min_price ? Number(p.bargain_min_price) : null,
    category: p.category,
    subcategory: p.subcategory,
    condition: p.condition,
    brand: p.brand,
    tags: p.tags,
    whatsappNumber: p.whatsapp_number,
    purchaseUrl: p.purchase_url,
    contactMethod: p.contactMethod,
    location: p.location,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    stock: p.stock,
    view_count: p.view_count,
    salesCount: p.sales_count,
    avgRating: Number(p.avg_rating),
    reviewCount: p.review_count,
    is_featured: p.is_featured,
    is_promoted: p.is_promoted,
    is_top_spot: p.is_top_spot,
    status: p.status,
    created_at: p.created_at?.toISOString(),
  };

  // Attach category-specific detail
  const detailKeys = [
    'vehicle_details', 'spare_part_details', 'real_estate_details', 'fashion_details',
    'shoe_details', 'electronics_details', 'furniture_details', 'food_details', 'grocery_details', 'book_details',
    'digital_product_details', 'service_details'
  ];
  for (const key of detailKeys) {
    if (p[key]) result[key] = formatDetail(p[key]);
  }

  // Attach active discounts
  if (p.product_discounts?.length) {
    result.discounts = p.product_discounts.map((d: any) => ({
      id: d.id,
      discountType: d.discount_type,
      discountValue: Number(d.discount_value),
      minQuantity: d.min_quantity,
      start_date: d.start_date?.toISOString(),
      end_date: d.end_date?.toISOString(),
    }));
  }

  return result;
}

function formatDetail(detail: any) {
  if (!detail) return null;
  const result: any = { ...detail };
  delete result.id;
  delete result.product_id;
  // Convert Decimals
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Prisma.Decimal) result[key] = Number(value);
    if (value instanceof Date) result[key] = value.toISOString();
  }
  return result;
}
