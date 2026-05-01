import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { categoryDetailSchemas } from './shop.types.js';

const SELLER_SELECT = {
  id: true, username: true, displayName: true, avatarUrl: true, isVerified: true
};

// ─── PRODUCT CRUD ───────────────────────────────────────

export class ShopService {

  static async createProduct(sellerId: string, data: any) {
    const { categoryDetails, ...productData } = data;

    // Validate category-specific details
    if (categoryDetails && categoryDetailSchemas[data.category]) {
      categoryDetailSchemas[data.category].parse(categoryDetails);
    }

    const product = await prisma.$transaction(async (tx: any) => {
      const p = await tx.product.create({
        data: {
          sellerId,
          title: productData.title,
          description: productData.description,
          imageUrls: productData.imageUrls,
          priceKr: new Prisma.Decimal(productData.priceKr),
          currency: productData.currency,
          localPrice: productData.localPrice ? new Prisma.Decimal(productData.localPrice) : undefined,
          wholesalePrice: productData.wholesalePrice ? new Prisma.Decimal(productData.wholesalePrice) : undefined,
          wholesaleMinQty: productData.wholesaleMinQty,
          bargainEnabled: productData.bargainEnabled || false,
          bargainMinPrice: productData.bargainMinPrice ? new Prisma.Decimal(productData.bargainMinPrice) : undefined,
          category: productData.category || 'OTHER',
          subcategory: productData.subcategory,
          condition: productData.condition || 'NEW',
          brand: productData.brand,
          tags: productData.tags || [],
          whatsappNumber: productData.whatsappNumber,
          purchaseUrl: productData.purchaseUrl,
          contactMethod: productData.contactMethod || 'WHATSAPP',
          location: productData.location,
          latitude: productData.latitude ? new Prisma.Decimal(productData.latitude) : undefined,
          longitude: productData.longitude ? new Prisma.Decimal(productData.longitude) : undefined,
          stock: productData.stock ?? 1,
          status: 'active',
        },
        include: { seller: { select: SELLER_SELECT } }
      });

      // Create category-specific detail record
      if (categoryDetails) {
        await createCategoryDetail(tx, p.id, productData.category, categoryDetails);
      }

      return p;
    });

    // Re-fetch with all details included
    return this.getProduct(product.id);
  }

  static async updateProduct(productId: string, sellerId: string, data: any) {
    const existing = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (existing.sellerId !== sellerId) throw new Error('You can only edit your own products');

    const { categoryDetails, ...updates } = data;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.imageUrls !== undefined) updateData.imageUrls = updates.imageUrls;
    if (updates.priceKr !== undefined) updateData.priceKr = new Prisma.Decimal(updates.priceKr);
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.localPrice !== undefined) updateData.localPrice = new Prisma.Decimal(updates.localPrice);
    if (updates.wholesalePrice !== undefined) updateData.wholesalePrice = new Prisma.Decimal(updates.wholesalePrice);
    if (updates.wholesaleMinQty !== undefined) updateData.wholesaleMinQty = updates.wholesaleMinQty;
    if (updates.bargainEnabled !== undefined) updateData.bargainEnabled = updates.bargainEnabled;
    if (updates.bargainMinPrice !== undefined) updateData.bargainMinPrice = new Prisma.Decimal(updates.bargainMinPrice);
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
    if (updates.condition !== undefined) updateData.condition = updates.condition;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.whatsappNumber !== undefined) updateData.whatsappNumber = updates.whatsappNumber;
    if (updates.purchaseUrl !== undefined) updateData.purchaseUrl = updates.purchaseUrl;
    if (updates.contactMethod !== undefined) updateData.contactMethod = updates.contactMethod;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.latitude !== undefined) updateData.latitude = new Prisma.Decimal(updates.latitude);
    if (updates.longitude !== undefined) updateData.longitude = new Prisma.Decimal(updates.longitude);
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.status !== undefined) updateData.status = updates.status;

    await prisma.$transaction(async (tx: any) => {
      await tx.product.update({ where: { id: productId }, data: updateData });

      if (categoryDetails) {
        const cat = updates.category || existing.category;
        await upsertCategoryDetail(tx, productId, cat as string, categoryDetails);
      }
    });

    return this.getProduct(productId);
  }

  static async deleteProduct(productId: string, sellerId: string) {
    const existing = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (existing.sellerId !== sellerId) throw new Error('You can only delete your own products');
    await prisma.product.update({ where: { id: productId }, data: { status: 'removed' } });
  }

  static async getProduct(productId: string, viewerId?: string) {
    const includeQuery: Prisma.ProductInclude = {
      seller: { select: SELLER_SELECT },
      vehicleDetail: true,
      sparePartDetail: true,
      realEstateDetail: true,
      fashionDetail: true,
      shoeDetail: true,
      electronicsDetail: true,
      foodDetail: true,
      bookDetail: true,
      digitalProductDetail: true,
      serviceDetail: true,
      discounts: { where: { isActive: true, endDate: { gte: new Date() } } },
    };

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: includeQuery
    });

    // Increment view count
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } }
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
    const where: Prisma.ProductWhereInput = { status: 'active' };

    // Global filters
    if (params.category) where.category = params.category as any;
    if (params.subcategory) where.subcategory = params.subcategory;
    if (params.sellerId) where.sellerId = params.sellerId;
    if (params.condition) where.condition = params.condition as any;
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' };
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };

    if (params.minPrice || params.maxPrice) {
      where.priceKr = {};
      if (params.minPrice) where.priceKr.gte = params.minPrice;
      if (params.maxPrice) where.priceKr.lte = params.maxPrice;
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
      if (params.bodyType) vWhere.bodyType = params.bodyType as any;
      if (params.fuelType) vWhere.fuelType = params.fuelType as any;
      if (params.transmission) vWhere.transmission = params.transmission as any;
      if (params.yearFrom || params.yearTo) {
        vWhere.year = {};
        if (params.yearFrom) vWhere.year.gte = params.yearFrom;
        if (params.yearTo) vWhere.year.lte = params.yearTo;
      }
      if (params.mileageMax) vWhere.mileage = { lte: params.mileageMax };
      where.vehicleDetail = vWhere;
    }

    // Spare parts filters
    if (params.partType || params.compatibleMake) {
      const spWhere: any = {};
      if (params.partType) spWhere.partType = params.partType;
      if (params.compatibleMake) spWhere.compatibleMakes = { has: params.compatibleMake };
      where.sparePartDetail = spWhere;
    }

    // Real estate filters
    if (params.propertyType || params.listingType || params.bedroomsMin || params.bathroomsMin) {
      const reWhere: any = {};
      if (params.propertyType) reWhere.propertyType = params.propertyType;
      if (params.listingType) reWhere.listingType = params.listingType;
      if (params.bedroomsMin) reWhere.bedrooms = { gte: params.bedroomsMin };
      if (params.bathroomsMin) reWhere.bathrooms = { gte: params.bathroomsMin };
      where.realEstateDetail = reWhere;
    }

    // Fashion/shoe filters
    if (params.size || params.color || params.gender) {
      if (params.category === 'SHOES') {
        const shWhere: any = {};
        if (params.size) shWhere.shoeSize = params.size;
        if (params.gender) shWhere.gender = params.gender;
        where.shoeDetail = shWhere;
      } else {
        const fWhere: any = {};
        if (params.size) fWhere.size = params.size;
        if (params.gender) fWhere.gender = params.gender;
        if (params.color) fWhere.colorVariants = { has: params.color };
        where.fashionDetail = fWhere;
      }
    }

    // Sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };
    switch (params.sortBy) {
      case 'price_asc': orderBy = { priceKr: 'asc' }; break;
      case 'price_desc': orderBy = { priceKr: 'desc' }; break;
      case 'popular': orderBy = { viewCount: 'desc' }; break;
      case 'rating': orderBy = { avgRating: 'desc' }; break;
    }

    const includeQuery: Prisma.ProductInclude = {
      seller: { select: SELLER_SELECT },
      vehicleDetail: true,
      sparePartDetail: true,
      realEstateDetail: true,
      fashionDetail: true,
      shoeDetail: true,
      electronicsDetail: true,
      foodDetail: true,
      bookDetail: true,
      digitalProductDetail: true,
      serviceDetail: true,
    };

    // Featured/promoted products first
    const products = await prisma.product.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: [{ isTopSpot: 'desc' }, { isPromoted: 'desc' }, { isFeatured: 'desc' }, orderBy],
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
    const products = await prisma.product.findMany({
      where: { sellerId, status: { not: 'removed' } },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: SELLER_SELECT },
        vehicleDetail: true,
        sparePartDetail: true,
      }
    });
    return products.map(formatProduct);
  }

  static async getProductsByCategory(category: string, cursor?: string, limit = 20) {
    return this.listProducts({ category, cursor, limit });
  }

  static async getTrendingProducts(limit = 20) {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      orderBy: [{ viewCount: 'desc' }, { salesCount: 'desc' }],
      take: limit,
      include: { seller: { select: SELLER_SELECT } }
    });
    return products.map(formatProduct);
  }

  static async getCategories() {
    const counts = await prisma.product.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: true,
    });
    return counts.map((c: any) => ({ category: c.category, count: c._count }));
  }

  // ─── VEHICLE FAVORITES ─────────────────────────────────

  static async addVehicleFavorite(userId: string, productId: string) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (product.category !== 'VEHICLES') throw new Error('Only vehicles can be favorited');

    return prisma.vehicleFavorite.create({
      data: { userId, productId },
      include: { product: { include: { seller: { select: SELLER_SELECT }, vehicleDetail: true } } }
    });
  }

  static async removeVehicleFavorite(userId: string, productId: string) {
    await prisma.vehicleFavorite.deleteMany({ where: { userId, productId } });
  }

  static async getVehicleFavorites(userId: string) {
    const favorites = await prisma.vehicleFavorite.findMany({
      where: { userId },
      include: { product: { include: { seller: { select: SELLER_SELECT }, vehicleDetail: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return favorites.map((f: any) => ({
      id: f.id,
      createdAt: f.createdAt.toISOString(),
      product: formatProduct(f.product),
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
    const admirers = await prisma.admire.findMany({
      where: { admirerId: userId },
      select: { admiredId: true }
    });
    const friendIds = admirers.map((a: any) => a.admiredId);

    // Find orders containing this product from friends
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: { buyerId: { in: friendIds } }
      },
      include: {
        order: {
          select: {
            buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            createdAt: true
          }
        }
      },
      distinct: ['orderId'],
      take: 10
    });

    return orderItems.map((item: any) => ({
      user: item.order.buyer,
      purchasedAt: item.order.createdAt.toISOString(),
    }));
  }

  static async getFriendRecommendations(userId: string, limit = 20) {
    // Get user's friends
    const admirers = await prisma.admire.findMany({
      where: { admirerId: userId },
      select: { admiredId: true }
    });
    const friendIds = admirers.map((a: any) => a.admiredId);

    if (!friendIds.length) return [];

    // Find products purchased by friends
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { buyerId: { in: friendIds } },
        product: { status: 'active' }
      },
      include: {
        product: {
          include: {
            seller: { select: SELLER_SELECT },
            vehicleDetail: true,
            fashionDetail: true,
          }
        }
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: limit * 2, // Get more to dedupe
    });

    // Deduplicate by product ID
    const seen = new Set<string>();
    const unique = orderItems.filter((item: any) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    }).slice(0, limit);

    return unique.map((item: any) => formatProduct(item.product));
  }

  // ─── SPARE PARTS COMPATIBILITY ─────────────────────────

  static async findCompatibleParts(params: { make: string; model?: string; year?: number; partType?: string }) {
    const where: any = {
      product: { status: 'active' },
      compatibleMakes: { has: params.make },
    };
    if (params.model) where.compatibleModels = { has: params.model };
    if (params.partType) where.partType = params.partType;

    const parts = await prisma.sparePartDetail.findMany({
      where,
      include: {
        product: { include: { seller: { select: SELLER_SELECT } } }
      }
    });

    // Filter by year range if provided
    const filtered = params.year
      ? parts.filter((p: any) => {
          if (p.compatibleYearFrom && p.compatibleYearTo) {
            return params.year! >= p.compatibleYearFrom && params.year! <= p.compatibleYearTo;
          }
          return true;
        })
      : parts;

    return filtered.map((p: any) => ({
      ...formatProduct(p.product),
      sparePartDetail: formatDetail(p),
    }));
  }
}

// ─── HELPERS ────────────────────────────────────────────

async function createCategoryDetail(tx: any, productId: string, category: string, details: any) {
  const map: Record<string, string> = {
    VEHICLES: 'vehicleDetail', SPARE_PARTS: 'sparePartDetail',
    REAL_ESTATE: 'realEstateDetail', FASHION: 'fashionDetail',
    SHOES: 'shoeDetail', ELECTRONICS: 'electronicsDetail',
    FOOD_FMCG: 'foodDetail', BOOKS: 'bookDetail',
    DIGITAL_PRODUCTS: 'digitalProductDetail', SERVICES: 'serviceDetail',
  };
  const model = map[category];
  if (!model) return;

  const data = { productId, ...details };
  if (details.expiryDate) data.expiryDate = new Date(details.expiryDate);
  if (details.fileSizeMb) data.fileSizeMb = new Prisma.Decimal(details.fileSizeMb);

  await (tx as any)[model].create({ data });
}

async function upsertCategoryDetail(tx: any, productId: string, category: string, details: any) {
  const map: Record<string, string> = {
    VEHICLES: 'vehicleDetail', SPARE_PARTS: 'sparePartDetail',
    REAL_ESTATE: 'realEstateDetail', FASHION: 'fashionDetail',
    SHOES: 'shoeDetail', ELECTRONICS: 'electronicsDetail',
    FOOD_FMCG: 'foodDetail', BOOKS: 'bookDetail',
    DIGITAL_PRODUCTS: 'digitalProductDetail', SERVICES: 'serviceDetail',
  };
  const model = map[category];
  if (!model) return;

  const existing = await (tx as any)[model].findUnique({ where: { productId } });
  const data = { ...details };
  if (details.expiryDate) data.expiryDate = new Date(details.expiryDate);
  if (details.fileSizeMb) data.fileSizeMb = new Prisma.Decimal(details.fileSizeMb);

  if (existing) {
    await (tx as any)[model].update({ where: { productId }, data });
  } else {
    await (tx as any)[model].create({ data: { productId, ...data } });
  }
}

function formatProduct(p: any) {
  const result: any = {
    id: p.id,
    seller: p.seller,
    title: p.title,
    description: p.description,
    imageUrls: p.imageUrls,
    priceKr: Number(p.priceKr),
    currency: p.currency,
    localPrice: p.localPrice ? Number(p.localPrice) : null,
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    wholesaleMinQty: p.wholesaleMinQty,
    bargainEnabled: p.bargainEnabled,
    bargainMinPrice: p.bargainMinPrice ? Number(p.bargainMinPrice) : null,
    category: p.category,
    subcategory: p.subcategory,
    condition: p.condition,
    brand: p.brand,
    tags: p.tags,
    whatsappNumber: p.whatsappNumber,
    purchaseUrl: p.purchaseUrl,
    contactMethod: p.contactMethod,
    location: p.location,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    stock: p.stock,
    viewCount: p.viewCount,
    salesCount: p.salesCount,
    avgRating: Number(p.avgRating),
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    isPromoted: p.isPromoted,
    isTopSpot: p.isTopSpot,
    status: p.status,
    createdAt: p.createdAt?.toISOString(),
  };

  // Attach category-specific detail
  const detailKeys = [
    'vehicleDetail', 'sparePartDetail', 'realEstateDetail', 'fashionDetail',
    'shoeDetail', 'electronicsDetail', 'foodDetail', 'bookDetail',
    'digitalProductDetail', 'serviceDetail'
  ];
  for (const key of detailKeys) {
    if (p[key]) result[key] = formatDetail(p[key]);
  }

  // Attach active discounts
  if (p.discounts?.length) {
    result.discounts = p.discounts.map((d: any) => ({
      id: d.id,
      discountType: d.discountType,
      discountValue: Number(d.discountValue),
      minQuantity: d.minQuantity,
      startDate: d.startDate?.toISOString(),
      endDate: d.endDate?.toISOString(),
    }));
  }

  return result;
}

function formatDetail(detail: any) {
  if (!detail) return null;
  const result: any = { ...detail };
  delete result.id;
  delete result.productId;
  // Convert Decimals
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Prisma.Decimal) result[key] = Number(value);
    if (value instanceof Date) result[key] = value.toISOString();
  }
  return result;
}
