import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

const USER_SELECT = { id: true, username: true, display_name: true, avatar_url: true, is_verified: true };

export class GarageService {

  static async createProfile(userId: string, data: any) {
    return prisma.garage_profiles.create({
      data: {
        user_id: userId,
        business_name: data.businessName,
        description: data.description,
        service_types: data.serviceTypes,
        certifications: data.certifications || [],
        location: data.location,
        latitude: data.latitude ? new Prisma.Decimal(data.latitude) : undefined,
        longitude: data.longitude ? new Prisma.Decimal(data.longitude) : undefined,
        service_area: data.serviceArea,
        offers_on_site: data.offersOnSite || false,
      },
      include: { User: { select: USER_SELECT } }
    });
  }

  static async getProfile(garageId: string) {
    return prisma.garage_profiles.findUniqueOrThrow({
      where: { id: garageId },
      include: {
        User: { select: USER_SELECT },
        garage_reviews: {
          include: { User: { select: USER_SELECT } },
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });
  }

  static async listGarages(params: { location?: string; serviceType?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };
    if (params.serviceType) where.service_types = { has: params.serviceType };

    const garages = await prisma.garage_profiles.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { avg_rating: 'desc' },
      include: { User: { select: USER_SELECT } }
    });

    const hasMore = garages.length > limit;
    const items = hasMore ? garages.slice(0, limit) : garages;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createBooking(userId: string, data: any) {
    return prisma.garage_bookings.create({
      data: {
        garage_id: data.garage_id,
        user_id: userId,
        service_type: data.serviceType,
        scheduled_date: new Date(data.scheduledDate),
        notes: data.notes,
        is_on_site: data.isOnSite || false,
        location: data.location,
        status: 'PENDING',
      },
      include: { garage_profiles: { include: { User: { select: USER_SELECT } } } }
    });
  }

  static async updateBookingStatus(bookingId: string, garageUserId: string, status: string) {
    const booking = await prisma.garage_bookings.findUniqueOrThrow({
      where: { id: bookingId },
      include: { garage_profiles: true }
    });
    if (booking.garage_profiles.user_id !== garageUserId) throw new Error('Not your garage');
    return prisma.garage_bookings.update({ where: { id: bookingId }, data: { status: status as any } });
  }

  static async getUserBookings(userId: string) {
    return prisma.garage_bookings.findMany({
      where: { user_id: userId },
      include: { garage_profiles: { include: { User: { select: USER_SELECT } } } },
      orderBy: { scheduled_date: 'desc' }
    });
  }

  static async getGarageBookings(garageId: string) {
    return prisma.garage_bookings.findMany({
      where: { garage_id: garageId },
      include: { User: { select: USER_SELECT } },
      orderBy: { scheduled_date: 'desc' }
    });
  }

  static async createReview(userId: string, data: { garage_id: string; rating: number; text?: string }) {
    const review = await prisma.garage_reviews.create({
      data: { garage_id: data.garage_id, user_id: userId, rating: data.rating, text: data.text },
      include: { User: { select: USER_SELECT } }
    });

    const agg = await prisma.garage_reviews.aggregate({
      where: { garage_id: data.garage_id },
      _avg: { rating: true }, _count: true,
    });
    await prisma.garage_profiles.update({
      where: { id: data.garage_id },
      data: { avg_rating: agg._avg.rating || 0, review_count: agg._count }
    });

    return review;
  }
}

export class ImporterService {

  static async createProfile(userId: string, data: any) {
    return prisma.importer_profiles.create({
      data: {
        user_id: userId,
        business_name: data.businessName,
        description: data.description,
        countries_served: data.countriesServed,
        specialization: data.specialization,
        years_experience: data.yearsExperience,
      },
      include: { User: { select: USER_SELECT } }
    });
  }

  static async listImporters(params: { country?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.country) where.countries_served = { has: params.country };

    const importers = await prisma.importer_profiles.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { total_imports: 'desc' },
      include: { User: { select: USER_SELECT } }
    });

    const hasMore = importers.length > limit;
    const items = hasMore ? importers.slice(0, limit) : importers;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createImportRequest(userId: string, data: any) {
    return prisma.import_requests.create({
      data: {
        user_id: userId,
        make: data.make,
        model: data.model,
        year_from: data.yearFrom,
        year_to: data.yearTo,
        country_of_origin: data.countryOfOrigin,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        requirements: data.requirements,
        status: 'PENDING',
      }
    });
  }

  static async getImportRequests(userId: string) {
    return prisma.import_requests.findMany({
      where: { user_id: userId },
      include: { import_quotes: { include: { importer_profiles: { include: { User: { select: USER_SELECT } } } } } },
      orderBy: { created_at: 'desc' }
    });
  }

  static async submitQuote(importerId: string, data: { requestId: string; quoteAmountKr: number; estimatedDays?: number; notes?: string }) {
    const profile = await prisma.importer_profiles.findUniqueOrThrow({ where: { user_id: importerId } });
    return prisma.import_quotes.create({
      data: {
        request_id: data.requestId,
        importer_id: profile.id,
        quote_amount_kr: new Prisma.Decimal(data.quoteAmountKr),
        estimated_days: data.estimatedDays,
        notes: data.notes,
        status: 'pending',
      }
    });
  }

  static async acceptQuote(requestId: string, quoteId: string, userId: string) {
    const request = await prisma.import_requests.findUniqueOrThrow({ where: { id: requestId } });
    if (request.user_id !== userId) throw new Error('Not your request');

    return prisma.$transaction([
      prisma.import_quotes.update({ where: { id: quoteId }, data: { status: 'accepted' } }),
      prisma.import_requests.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
    ]);
  }
}

export class LogisticsService {

  static async createProfile(userId: string, data: any) {
    return prisma.logistics_companies.create({
      data: {
        user_id: userId,
        company_name: data.company_name,
        description: data.description,
        service_types: data.serviceTypes,
        coverage_areas: data.coverageAreas,
        vehicle_types: data.vehicleTypes || [],
      },
      include: { User: { select: USER_SELECT } }
    });
  }

  static async listCompanies(params: { area?: string; serviceType?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.area) where.coverage_areas = { has: params.area };
    if (params.serviceType) where.service_types = { has: params.serviceType };

    const companies = await prisma.logistics_companies.findMany({
      where, take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: { User: { select: USER_SELECT } }
    });

    const hasMore = companies.length > limit;
    const items = hasMore ? companies.slice(0, limit) : companies;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  static async createShippingJob(requesterId: string, data: any) {
    return prisma.shipping_jobs.create({
      data: {
        requester_id: requesterId,
        pickup_location: data.pickupLocation,
        delivery_location: data.deliveryLocation,
        job_type: data.jobType,
        vehicle_desc: data.vehicleDesc,
        status: 'open',
      }
    });
  }

  static async getShippingJobs(params: { status?: string; cursor?: string; limit?: number }) {
    const limit = params.limit || 20;
    const where: any = {};
    if (params.status) where.status = params.status;

    return prisma.shipping_jobs.findMany({
      where, take: limit,
      orderBy: { created_at: 'desc' },
      include: { User: { select: USER_SELECT }, logistics_companies: true }
    });
  }
}

export class PremiumService {

  static DAILY_RATES: Record<string, number> = {
    FEATURED: 10,
    PROMOTED: 25,
    TOP_SPOT: 50,
  };

  static async createListing(sellerId: string, data: { product_id: string; type: string; days: number }) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: data.product_id } });
    if (product.seller_id !== sellerId) throw new Error('Not your product');

    const dailyRate = this.DAILY_RATES[data.type] || 10;
    const totalCost = dailyRate * data.days;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + data.days * 86400000);

    // Update product flags
    const updateData: any = {};
    if (data.type === 'FEATURED') { updateData.is_featured = true; updateData.featured_until = endDate; }
    if (data.type === 'PROMOTED') { updateData.is_promoted = true; updateData.promoted_until = endDate; }
    if (data.type === 'TOP_SPOT') { updateData.is_top_spot = true; updateData.top_spot_until = endDate; }

    const [listing] = await prisma.$transaction([
      prisma.premium_listings.create({
        data: {
          product_id: data.product_id,
          seller_id: sellerId,
          type: data.type as any,
          daily_rate_kr: new Prisma.Decimal(dailyRate),
          total_paid_kr: new Prisma.Decimal(totalCost),
          start_date: startDate,
          end_date: endDate,
          is_active: true,
        }
      }),
      prisma.products.update({ where: { id: data.product_id }, data: updateData }),
    ]);

    return { listing, totalCostKr: totalCost };
  }
}

export class ProductShareService {

  static async shareProduct(userId: string, data: {
    product_id: string; contentId?: string; contentType?: string; caption?: string;
  }) {
    return prisma.product_shares.create({
      data: {
        product_id: data.product_id,
        user_id: userId,
        content_id: data.contentId,
        content_type: data.contentType,
        caption: data.caption,
      }
    });
  }

  static async tagProduct(data: {
    product_id: string; contentId: string; contentType: string;
    positionX?: number; positionY?: number; timestamp?: number;
  }) {
    return prisma.product_tags.create({
      data: {
        product_id: data.product_id,
        content_id: data.contentId,
        content_type: data.contentType,
        position_x: data.positionX ? new Prisma.Decimal(data.positionX) : undefined,
        position_y: data.positionY ? new Prisma.Decimal(data.positionY) : undefined,
        timestamp: data.timestamp,
      }
    });
  }

  static async getProductTags(contentId: string, contentType: string) {
    return prisma.product_tags.findMany({
      where: { content_id: contentId, content_type: contentType },
      include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true } } }
    });
  }
}
