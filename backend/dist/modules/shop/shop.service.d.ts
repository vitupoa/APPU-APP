export declare class ShopService {
    static createProduct(data: {
        sellerId: string;
        title: string;
        description?: string;
        imageUrls: string[];
        priceKr: number;
        category?: string;
        whatsappNumber: string;
    }): Promise<{
        id: any;
        seller: any;
        title: any;
        description: any;
        imageUrls: any;
        priceKr: number;
        category: any;
        whatsappNumber: any;
        status: any;
        createdAt: any;
    }>;
    static updateProduct(productId: string, sellerId: string, data: {
        title?: string;
        description?: string;
        imageUrls?: string[];
        priceKr?: number;
        category?: string;
        whatsappNumber?: string;
        status?: string;
    }): Promise<{
        id: any;
        seller: any;
        title: any;
        description: any;
        imageUrls: any;
        priceKr: number;
        category: any;
        whatsappNumber: any;
        status: any;
        createdAt: any;
    }>;
    static deleteProduct(productId: string, sellerId: string): Promise<void>;
    static getProduct(productId: string): Promise<{
        id: any;
        seller: any;
        title: any;
        description: any;
        imageUrls: any;
        priceKr: number;
        category: any;
        whatsappNumber: any;
        status: any;
        createdAt: any;
    }>;
    static listProducts(params: {
        category?: string;
        sellerId?: string;
        query?: string;
        cursor?: string;
        limit: number;
    }): Promise<{
        items: {
            id: any;
            seller: any;
            title: any;
            description: any;
            imageUrls: any;
            priceKr: number;
            category: any;
            whatsappNumber: any;
            status: any;
            createdAt: any;
        }[];
        nextCursor: string | null;
    }>;
    static getMyProducts(sellerId: string): Promise<{
        id: any;
        seller: any;
        title: any;
        description: any;
        imageUrls: any;
        priceKr: number;
        category: any;
        whatsappNumber: any;
        status: any;
        createdAt: any;
    }[]>;
}
//# sourceMappingURL=shop.service.d.ts.map