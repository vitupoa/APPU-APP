import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';

const USER_SELECT = { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true };

export class GarageService {

  static async createProfile(userId: string, data: any) {
    return prisma.garageProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        serviceTypes: data.serviceTypes,
        certifications: data.certifications || [],
        location: data.location,
        latitude: data.latitude ? new Prisma.Decimal(data.latitude) : undefined,
        longitude: data.longitude ? new Prisma.Decimal(data.longitude) : undefined,
        serviceArea: data.serviceArea,
        offersOnSite: data.offersOnSite || false,
      },
      include: { user: { select: USER_SELECT } }
    });
  }

  static async getProfile(garageId: string) {
    return prisma.garageProfile.findUniqueOrThrow({
      where: { id: garageId },
      include: {
        user: { select: USER_SELECT },
        reviews: {
          include: { user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  static async listGarages(params: { location?: string; serviceType?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };
    if (params.serviceType) where.serviceTypes = { has: params.serviceType };

    const garages = await prisma.garageProfile.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { avgRating: 'desc' },
      include: { user: { select: USER_SELECT } }
    });

    const hasMore = garages.length > limit;
    const items = hasMore ? garages.slice(0, limit) : garages;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createBooking(userId: string, data: any) {
    return prisma.garageBooking.create({
      data: {
        garageId: data.garageId,
        userId,
        serviceType: data.serviceType,
        scheduledDate: new Date(data.scheduledDate),
        notes: data.notes,
        isOnSite: data.isOnSite || false,
        location: data.location,
        status: 'PENDING',
      },
      include: { garage: { include: { user: { select: USER_SELECT } } } }
    });
  }

  static async updateBookingStatus(bookingId: string, garageUserId: string, status: string) {
    const booking = await prisma.garageBooking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { garage: true }
    });
    if (booking.garage.userId !== garageUserId) throw new Error('Not your garage');
    return prisma.garageBooking.update({ where: { id: bookingId }, data: { status: status as any } });
  }

  static async getUserBookings(userId: string) {
    return prisma.garageBooking.findMany({
      where: { userId },
      include: { garage: { include: { user: { select: USER_SELECT } } } },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  static async getGarageBookings(garageId: string) {
    return prisma.garageBooking.findMany({
      where: { garageId },
      include: { user: { select: USER_SELECT } },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  static async createReview(userId: string, data: { garageId: string; rating: number; text?: string }) {
    const review = await prisma.garageReview.create({
      data: { garageId: data.garageId, userId, rating: data.rating, text: data.text },
      include: { user: { select: USER_SELECT } }
    });

    const agg = await prisma.garageReview.aggregate({
      where: { garageId: data.garageId },
      _avg: { rating: true }, _count: true,
    });
    await prisma.garageProfile.update({
      where: { id: data.garageId },
      data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count }
    });

    return review;
  }
}

export class ImporterService {

  static async createProfile(userId: string, data: any) {
    return prisma.importerProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        countriesServed: data.countriesServed,
        specialization: data.specialization,
        yearsExperience: data.yearsExperience,
      },
      include: { user: { select: USER_SELECT } }
    });
  }

  static async listImporters(params: { country?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.country) where.countriesServed = { has: params.country };

    const importers = await prisma.importerProfile.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { totalImports: 'desc' },
      include: { user: { select: USER_SELECT } }
    });

    const hasMore = importers.length > limit;
    const items = hasMore ? importers.slice(0, limit) : importers;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createImportRequest(userId: string, data: any) {
    return prisma.importRequest.create({
      data: {
        userId,
        make: data.make,
        model: data.model,
        yearFrom: data.yearFrom,
        yearTo: data.yearTo,
        countryOfOrigin: data.countryOfOrigin,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        requirements: data.requirements,
        status: 'PENDING',
      }
    });
  }

  static async getImportRequests(userId: string) {
    return prisma.importRequest.findMany({
      where: { userId },
      include: { quotes: { include: { importer: { include: { user: { select: USER_SELECT } } } } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async submitQuote(importerId: string, data: { requestId: string; quoteAmountKr: number; estimatedDays?: number; notes?: string }) {
    const profile = await prisma.importerProfile.findUniqueOrThrow({ where: { userId: importerId } });
    return prisma.importQuote.create({
      data: {
        requestId: data.requestId,
        importerId: profile.id,
        quoteAmountKr: new Prisma.Decimal(data.quoteAmountKr),
        estimatedDays: data.estimatedDays,
        notes: data.notes,
        status: 'pending',
      }
    });
  }

  static async acceptQuote(requestId: string, quoteId: string, userId: string) {
    const request = await prisma.importRequest.findUniqueOrThrow({ where: { id: requestId } });
    if (request.userId !== userId) throw new Error('Not your request');

    return prisma.$transaction([
      prisma.importQuote.update({ where: { id: quoteId }, data: { status: 'accepted' } }),
      prisma.importRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
    ]);
  }
}

export class LogisticsService {

  static async createProfile(userId: string, data: any) {
    return prisma.logisticsCompany.create({
      data: {
        userId,
        companyName: data.companyName,
        description: data.description,
        serviceTypes: data.serviceTypes,
        coverageAreas: data.coverageAreas,
        vehicleTypes: data.vehicleTypes || [],
      },
      include: { user: { select: USER_SELECT } }
    });
  }

  static async listCompanies(params: { area?: string; serviceType?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.area) where.coverageAreas = { has: params.area };
    if (params.serviceType) where.serviceTypes = { has: params.serviceType };

    const companies = await prisma.logisticsCompany.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: { user: { select: USER_SELECT } }
    });

    const hasMore = companies.length > limit;
    const items = hasMore ? companies.slice(0, limit) : companies;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createShippingJob(requesterId: string, data: any) {
    return prisma.shippingJob.create({
      data: {
        requesterId,
        pickupLocation: data.pickupLocation,
        deliveryLocation: data.deliveryLocation,
        jobType: data.jobType,
        vehicleDesc: data.vehicleDesc,
        status: 'open',
      }
    });
  }

  static async getShippingJobs(params: { status?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.status) where.status = params.status;

    return prisma.shippingJob.findMany({
      where, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { requester: { select: USER_SELECT }, logistics: true }
    });
  }
}

export class LiveShoppingService {

  static async createSession(hostId: string, data: any) {
    const session = await prisma.liveSession.create({
      data: {
        hostId,
        title: data.title,
        description: data.description,
        scheduledStart: new Date(data.scheduledStart),
        status: 'SCHEDULED',
      }
    });

    if (data.productIds?.length) {
      await prisma.liveSessionProduct.createMany({
        data: data.productIds.map((pid: string, i: number) => ({
          sessionId: session.id, productId: pid, sortOrder: i,
        }))
      });
    }

    return prisma.liveSession.findUnique({
      where: { id: session.id },
      include: {
        host: { select: USER_SELECT },
        products: { include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } } }
      }
    });
  }

  static async startSession(sessionId: string, hostId: string) {
    const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (session.hostId !== hostId) throw new Error('Not your session');
    return prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: 'LIVE', actualStart: new Date() }
    });
  }

  static async endSession(sessionId: string, hostId: string) {
    const session = await prisma.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (session.hostId !== hostId) throw new Error('Not your session');
    return prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt: new Date() }
    });
  }

  static async getActiveSessions() {
    return prisma.liveSession.findMany({
      where: { status: 'LIVE' },
      include: {
        host: { select: USER_SELECT },
        products: { include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } } }
      },
      orderBy: { viewerCount: 'desc' }
    });
  }

  static async getUpcomingSessions(limit = 10) {
    return prisma.liveSession.findMany({
      where: { status: 'SCHEDULED', scheduledStart: { gt: new Date() } },
      include: { host: { select: USER_SELECT } },
      orderBy: { scheduledStart: 'asc' },
      take: limit
    });
  }
}

export class PremiumService {

  static DAILY_RATES: Record<string, number> = {
    FEATURED: 10,
    PROMOTED: 25,
    TOP_SPOT: 50,
  };

  static async createListing(sellerId: string, data: { productId: string; type: string; days: number }) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } });
    if (product.sellerId !== sellerId) throw new Error('Not your product');

    const dailyRate = this.DAILY_RATES[data.type] || 10;
    const totalCost = dailyRate * data.days;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + data.days * 86400000);

    // Update product flags
    const updateData: any = {};
    if (data.type === 'FEATURED') { updateData.isFeatured = true; updateData.featuredUntil = endDate; }
    if (data.type === 'PROMOTED') { updateData.isPromoted = true; updateData.promotedUntil = endDate; }
    if (data.type === 'TOP_SPOT') { updateData.isTopSpot = true; updateData.topSpotUntil = endDate; }

    const [listing] = await prisma.$transaction([
      prisma.premiumListing.create({
        data: {
          productId: data.productId,
          sellerId,
          type: data.type as any,
          dailyRateKr: new Prisma.Decimal(dailyRate),
          totalPaidKr: new Prisma.Decimal(totalCost),
          startDate,
          endDate,
          isActive: true,
        }
      }),
      prisma.product.update({ where: { id: data.productId }, data: updateData }),
    ]);

    return { listing, totalCostKr: totalCost };
  }
}

export class ProductShareService {

  static async shareProduct(userId: string, data: {
    productId: string; contentId?: string; contentType?: string; caption?: string;
  }) {
    return prisma.productShare.create({
      data: {
        productId: data.productId,
        userId,
        contentId: data.contentId,
        contentType: data.contentType,
        caption: data.caption,
      }
    });
  }

  static async tagProduct(data: {
    productId: string; contentId: string; contentType: string;
    positionX?: number; positionY?: number; timestamp?: number;
  }) {
    return prisma.productTag.create({
      data: {
        productId: data.productId,
        contentId: data.contentId,
        contentType: data.contentType,
        positionX: data.positionX ? new Prisma.Decimal(data.positionX) : undefined,
        positionY: data.positionY ? new Prisma.Decimal(data.positionY) : undefined,
        timestamp: data.timestamp,
      }
    });
  }

  static async getProductTags(contentId: string, contentType: string) {
    return prisma.productTag.findMany({
      where: { contentId, contentType },
      include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } }
    });
  }
}
