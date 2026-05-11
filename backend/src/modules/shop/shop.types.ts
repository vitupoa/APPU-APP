import { z } from 'zod';

// ─── ENUMS (mirror Prisma) ──────────────────────────────

export const ProductCategoryEnum = z.enum([
  'VEHICLES', 'SPARE_PARTS', 'REAL_ESTATE', 'FASHION', 'SHOES',
  'ELECTRONICS', 'FURNITURE', 'FOOD_FMCG', 'GROCERIES', 'BOOKS', 'DIGITAL_PRODUCTS', 'SERVICES', 'OTHER'
]);

export const ProductConditionEnum = z.enum(['NEW', 'USED', 'REFURBISHED', 'FOR_PARTS']);
export const ContactMethodEnum = z.enum(['WHATSAPP', 'WEBSITE', 'PHONE', 'IN_APP_CHAT']);
export const FuelTypeEnum = z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG']);
export const TransmissionEnum = z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'DCT']);
export const BodyTypeEnum = z.enum([
  'SEDAN', 'COUPE', 'HATCHBACK', 'SUV', 'PICKUP', 'VAN',
  'CONVERTIBLE', 'WAGON', 'MINIVAN', 'BUS', 'TRUCK', 'TRAILER', 'MOTORCYCLE'
]);

// ─── CATEGORY DETAIL SCHEMAS ────────────────────────────

const vehicleDetailSchema = z.object({
  vehicleType: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int().min(1900).max(2030),
  mileage: z.number().int().optional(),
  fuelType: FuelTypeEnum.optional(),
  transmission: TransmissionEnum.optional(),
  bodyType: BodyTypeEnum.optional(),
  engineSize: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  numberOfOwners: z.number().int().optional(),
  logbookReady: z.boolean().optional(),
  importStatus: z.string().optional(),
  importCertUrl: z.string().url().optional(),
  auctionSheetUrl: z.string().url().optional(),
  accidentHistory: z.boolean().optional(),
  tradeInEnabled: z.boolean().optional(),
  swapEnabled: z.boolean().optional(),
});

const sparePartDetailSchema = z.object({
  compatibleMakes: z.array(z.string()),
  compatibleModels: z.array(z.string()),
  compatibleYearFrom: z.number().int().optional(),
  compatibleYearTo: z.number().int().optional(),
  partType: z.string(),
  partNumber: z.string().optional(),
  oemNumber: z.string().optional(),
  isGenuine: z.boolean().optional(),
  fitsLeft: z.boolean().optional(),
  fitsRight: z.boolean().optional(),
  fitsFront: z.boolean().optional(),
  fitsRear: z.boolean().optional(),
});

const realEstateDetailSchema = z.object({
  propertyType: z.string(),
  listingType: z.enum(['rent', 'sale']),
  landSize: z.string().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  floors: z.number().int().optional(),
  yearBuilt: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  legalDocuments: z.array(z.string()).optional(),
  furnished: z.boolean().optional(),
  parking: z.boolean().optional(),
});

const fashionDetailSchema = z.object({
  size: z.string().optional(),
  material: z.string().optional(),
  colorVariants: z.array(z.string()).optional(),
  fitType: z.string().optional(),
  pattern: z.string().optional(),
  season: z.string().optional(),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  careInstructions: z.string().optional(),
});

const shoeDetailSchema = z.object({
  shoeSize: z.string(),
  soleMaterial: z.string().optional(),
  heelHeight: z.string().optional(),
  closureType: z.string().optional(),
  waterResistant: z.boolean().optional(),
  gender: z.string().optional(),
});

const furnitureDetailSchema = z.object({
  furnitureType: z.string(),
  material: z.string().optional(),
  color: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  seatingCapacity: z.number().int().optional(),
  assemblyRequired: z.boolean().optional(),
  style: z.string().optional(),
  warrantyMonths: z.number().int().optional(),
});

const electronicsDetailSchema = z.object({
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  screenSize: z.string().optional(),
  batteryLife: z.string().optional(),
  os: z.string().optional(),
  connectivity: z.array(z.string()).optional(),
  serialNumber: z.string().optional(),
  warrantyMonths: z.number().int().optional(),
});

const foodDetailSchema = z.object({
  ingredients: z.array(z.string()).optional(),
  nutritionalInfo: z.any().optional(),
  expiryDate: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  isOrganic: z.boolean().optional(),
  weightVolume: z.string().optional(),
});

const groceryDetailSchema = z.object({
  groceryType: z.string(), // fresh_produce, dry_goods, frozen, canned, dairy, bakery, beverages, snacks, household, baby, pet
  brand: z.string().optional(),
  weightVolume: z.string().optional(),
  packSize: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  expiryDate: z.string().optional(),
  storageType: z.string().optional(), // room_temp, refrigerated, frozen
  isOrganic: z.boolean().optional(),
  isHalal: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  countryOfOrigin: z.string().optional(),
  certifications: z.array(z.string()).optional(),
});

const bookDetailSchema = z.object({
  author: z.string(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  language: z.string().optional(),
  pageCount: z.number().int().optional(),
  genre: z.string().optional(),
  downloadable: z.boolean().optional(),
  downloadUrl: z.string().url().optional(),
});

const digitalProductDetailSchema = z.object({
  fileFormat: z.string(),
  fileSizeMb: z.number().optional(),
  licenseType: z.string(),
  downloadLimit: z.number().int().optional(),
  drmProtected: z.boolean().optional(),
  downloadUrl: z.string().url().optional(),
});

const serviceDetailSchema = z.object({
  serviceType: z.string(),
  deliveryMode: z.enum(['online', 'onsite', 'both']),
  durationMinutes: z.number().int().optional(),
  availability: z.string().optional(),
  revisionsAllowed: z.number().int().optional(),
  turnaroundDays: z.number().int().optional(),
});

// ─── CATEGORY DETAIL MAP ────────────────────────────────

export const categoryDetailSchemas: Record<string, z.ZodType> = {
  VEHICLES: vehicleDetailSchema,
  SPARE_PARTS: sparePartDetailSchema,
  REAL_ESTATE: realEstateDetailSchema,
  FASHION: fashionDetailSchema,
  SHOES: shoeDetailSchema,
  ELECTRONICS: electronicsDetailSchema,
  FURNITURE: furnitureDetailSchema,
  FOOD_FMCG: foodDetailSchema,
  GROCERIES: groceryDetailSchema,
  BOOKS: bookDetailSchema,
  DIGITAL_PRODUCTS: digitalProductDetailSchema,
  SERVICES: serviceDetailSchema,
};

// ─── PRODUCT SCHEMAS ────────────────────────────────────

export const createProductSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  priceKr: z.number().positive(),
  currency: z.string().max(3).optional(),
  localPrice: z.number().positive().optional(),
  wholesalePrice: z.number().positive().optional(),
  wholesaleMinQty: z.number().int().min(2).optional(),
  bargainEnabled: z.boolean().optional(),
  bargainMinPrice: z.number().positive().optional(),
  category: ProductCategoryEnum,
  subcategory: z.string().optional(),
  condition: ProductConditionEnum.optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  whatsappNumber: z.string().min(7).max(20).optional(),
  purchaseUrl: z.string().url().optional(),
  contactMethod: ContactMethodEnum.optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  stock: z.number().int().min(0).optional(),
  // Category-specific details
  categoryDetails: z.any().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['active', 'sold', 'paused']).optional(),
});

export const productFilterSchema = z.object({
  category: ProductCategoryEnum.optional(),
  subcategory: z.string().optional(),
  q: z.string().optional(),
  sellerId: z.string().optional(),
  condition: ProductConditionEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  location: z.string().optional(),
  brand: z.string().optional(),
  // Vehicle filters
  bodyType: BodyTypeEnum.optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  mileageMax: z.coerce.number().int().optional(),
  fuelType: FuelTypeEnum.optional(),
  transmission: TransmissionEnum.optional(),
  // Spare parts
  partType: z.string().optional(),
  compatibleMake: z.string().optional(),
  // Real estate
  propertyType: z.string().optional(),
  listingType: z.enum(['rent', 'sale']).optional(),
  bedroomsMin: z.coerce.number().int().optional(),
  bathroomsMin: z.coerce.number().int().optional(),
  // Fashion
  size: z.string().optional(),
  color: z.string().optional(),
  gender: z.string().optional(),
  // Pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).optional(),
});

// ─── REVIEW SCHEMA ──────────────────────────────────────

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  text: z.string().max(2000).optional(),
  videoUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

// ─── WISHLIST SCHEMAS ───────────────────────────────────

export const createWishlistSchema = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean().optional(),
  isRegistry: z.boolean().optional(),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
});

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).optional(),
  priority: z.number().int().min(0).max(5).optional(),
  notes: z.string().max(500).optional(),
});

// ─── CART SCHEMA ────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).optional(),
  bargainPrice: z.number().positive().optional(),
});

// ─── FLASH SALE SCHEMA ──────────────────────────────────

export const createFlashSaleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  type: z.enum(['FLASH', 'LIGHTNING', 'DAILY_FEATURED', 'CLEARANCE']),
  startTime: z.string(),
  endTime: z.string(),
  products: z.array(z.object({
    productId: z.string().uuid(),
    salePrice: z.number().positive(),
    stockLimit: z.number().int().optional(),
    perUserLimit: z.number().int().optional(),
  })).min(1),
});

// ─── GROUP BUY SCHEMA ───────────────────────────────────

export const createGroupBuySchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  targetParticipants: z.number().int().min(2),
  discountPercent: z.number().min(1).max(90),
  expiresAt: z.string(),
});

// ─── GARAGE SCHEMAS ─────────────────────────────────────

export const createGarageProfileSchema = z.object({
  businessName: z.string().min(2).max(200),
  description: z.string().optional(),
  serviceTypes: z.array(z.string()).min(1),
  certifications: z.array(z.string()).optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceArea: z.string().optional(),
  offersOnSite: z.boolean().optional(),
});

export const createBookingSchema = z.object({
  garageId: z.string().uuid(),
  serviceType: z.string(),
  scheduledDate: z.string(),
  notes: z.string().optional(),
  isOnSite: z.boolean().optional(),
  location: z.string().optional(),
});

// ─── IMPORTER SCHEMAS ───────────────────────────────────

export const createImporterProfileSchema = z.object({
  businessName: z.string().min(2).max(200),
  description: z.string().optional(),
  countriesServed: z.array(z.string()).min(1),
  specialization: z.string().optional(),
  yearsExperience: z.number().int().optional(),
});

export const createImportRequestSchema = z.object({
  make: z.string(),
  model: z.string(),
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  countryOfOrigin: z.string().optional(),
  budget: z.number().positive().optional(),
  requirements: z.string().optional(),
});

// ─── LIVE SESSION SCHEMA ────────────────────────────────

export const createLiveSessionSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  scheduledStart: z.string(),
  productIds: z.array(z.string().uuid()).optional(),
});

// ─── DEAL ALERT SCHEMA ──────────────────────────────────

export const createDealAlertSchema = z.object({
  productId: z.string().uuid().optional(),
  category: ProductCategoryEnum.optional(),
  maxPriceKr: z.number().positive().optional(),
  keywords: z.array(z.string()).optional(),
});

// ─── PREMIUM LISTING SCHEMA ────────────────────────────

export const createPremiumListingSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['FEATURED', 'PROMOTED', 'TOP_SPOT']),
  days: z.number().int().min(1).max(30),
});

// ─── PRODUCT SHARE SCHEMA ──────────────────────────────

export const createProductShareSchema = z.object({
  productId: z.string().uuid(),
  contentId: z.string().optional(),
  contentType: z.enum(['POST', 'SHORT', 'STORY']).optional(),
  caption: z.string().optional(),
});

// ─── GIFT SCHEMA ────────────────────────────────────────

export const sendGiftSchema = z.object({
  recipientId: z.string().uuid(),
  productId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

// ─── SHIPPING JOB SCHEMA ───────────────────────────────

export const createShippingJobSchema = z.object({
  pickupLocation: z.string(),
  deliveryLocation: z.string(),
  jobType: z.enum(['shipping', 'towing', 'delivery']),
  vehicleDesc: z.string().optional(),
});

// ─── LOGISTICS SCHEMA ──────────────────────────────────

export const createLogisticsProfileSchema = z.object({
  companyName: z.string().min(2).max(200),
  description: z.string().optional(),
  serviceTypes: z.array(z.string()).min(1),
  coverageAreas: z.array(z.string()).min(1),
  vehicleTypes: z.array(z.string()).optional(),
});

// ─── ORDER SCHEMAS ─────────────────────────────────────

export const createOrderSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// ─── DISCOUNT SCHEMA ───────────────────────────────────

export const createDiscountSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minQuantity: z.number().int().min(1).optional(),
  startDate: z.string(),
  endDate: z.string(),
});

// ─── PRICE CALCULATOR SCHEMA ───────────────────────────

export const priceCalculatorSchema = z.object({
  vehiclePriceUsd: z.coerce.number().positive(),
  destinationCountry: z.enum(['KE', 'TZ', 'UG', 'RW']),
  port: z.string().optional(),
  engineCc: z.coerce.number().int().optional(),
  yearOfManufacture: z.coerce.number().int().optional(),
});

// ─── VEHICLE FAVORITE SCHEMA ───────────────────────────

export const vehicleFavoriteSchema = z.object({
  productId: z.string().uuid(),
});
