"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
class ShopService {
    static async createProduct(data) {
        const product = await database_1.prisma.product.create({
            data: {
                sellerId: data.sellerId,
                title: data.title,
                description: data.description,
                imageUrls: data.imageUrls,
                priceKr: new client_1.Prisma.Decimal(data.priceKr),
                category: data.category,
                whatsappNumber: data.whatsappNumber,
                status: 'active'
            },
            include: {
                seller: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        return formatProduct(product);
    }
    static async updateProduct(productId, sellerId, data) {
        // Verify ownership
        const existing = await database_1.prisma.product.findUniqueOrThrow({ where: { id: productId } });
        if (existing.sellerId !== sellerId) {
            throw new Error('You can only edit your own products');
        }
        const product = await database_1.prisma.product.update({
            where: { id: productId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
                ...(data.priceKr !== undefined && { priceKr: new client_1.Prisma.Decimal(data.priceKr) }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
                ...(data.status !== undefined && { status: data.status })
            },
            include: {
                seller: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        return formatProduct(product);
    }
    static async deleteProduct(productId, sellerId) {
        const existing = await database_1.prisma.product.findUniqueOrThrow({ where: { id: productId } });
        if (existing.sellerId !== sellerId) {
            throw new Error('You can only delete your own products');
        }
        await database_1.prisma.product.update({
            where: { id: productId },
            data: { status: 'removed' }
        });
    }
    static async getProduct(productId) {
        const product = await database_1.prisma.product.findUniqueOrThrow({
            where: { id: productId },
            include: {
                seller: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        return formatProduct(product);
    }
    static async listProducts(params) {
        const { category, sellerId, query, cursor, limit } = params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = { status: 'active' };
        if (category)
            where.category = category;
        if (sellerId)
            where.sellerId = sellerId;
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ];
        }
        const products = await database_1.prisma.product.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        const hasMore = products.length > limit;
        const items = hasMore ? products.slice(0, limit) : products;
        return {
            items: items.map(formatProduct),
            nextCursor: hasMore ? items[items.length - 1].id : null
        };
    }
    static async getMyProducts(sellerId) {
        const products = await database_1.prisma.product.findMany({
            where: { sellerId, status: { not: 'removed' } },
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
                }
            }
        });
        return products.map(formatProduct);
    }
}
exports.ShopService = ShopService;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatProduct(p) {
    return {
        id: p.id,
        seller: p.seller,
        title: p.title,
        description: p.description,
        imageUrls: p.imageUrls,
        priceKr: Number(p.priceKr),
        category: p.category,
        whatsappNumber: p.whatsappNumber,
        status: p.status,
        createdAt: p.createdAt.toISOString()
    };
}
//# sourceMappingURL=shop.service.js.map