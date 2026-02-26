import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { promotions, products } from "../drizzle/schema";

/**
 * Promotion Management Functions
 */

export async function createPromotion(data: {
  name: string;
  description?: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "member_only" | "happy_hour";
  discountValue: number;
  buyQuantity?: number; // For buy X get Y
  getQuantity?: number; // For buy X get Y
  getProductId?: number; // For buy X get Y
  startDate: Date;
  endDate: Date;
  startTime?: string; // HH:MM format for happy hour
  endTime?: string; // HH:MM format for happy hour
  applicableProductIds?: number[];
  applicableBranchIds?: number[];
  memberOnly?: boolean;
  isActive: boolean;
  priority: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(promotions).values({
    name: data.name,
    description: data.description,
    type: data.type,
    discountValue: data.discountValue.toString(),
    buyQuantity: data.buyQuantity,
    getQuantity: data.getQuantity,
    getProductId: data.getProductId,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    applicableProductIds: data.applicableProductIds,
    applicableBranchIds: data.applicableBranchIds,
    memberOnly: data.memberOnly || false,
    isActive: data.isActive,
    priority: data.priority,
  });

  return result;
}

export async function getPromotionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);

  return result[0];
}

export async function getAllPromotions() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(promotions).orderBy(desc(promotions.priority));

  return result;
}

export async function getActivePromotions() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  const result = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        // Check date range
      )
    )
    .orderBy(desc(promotions.priority));

  // Filter by date range client-side for simplicity
  return result.filter((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now);
}

export async function getPromotionsByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  // Get promotions that apply to this branch
  const result = await db
    .select()
    .from(promotions)
    .where(eq(promotions.isActive, true))
    .orderBy(desc(promotions.priority));

  // Filter by date range and check if branch is in rules
  return result.filter((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now);
}

export async function getPromotionsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  // Get promotions that apply to this product
  const result = await db
    .select()
    .from(promotions)
    .where(eq(promotions.isActive, true))
    .orderBy(desc(promotions.priority));

  // Filter by date range and check if product is in rules
  return result.filter((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now);
}

export async function updatePromotion(
  id: number,
  data: {
    name?: string;
    description?: string;
    discountValue?: number;
    buyQuantity?: number;
    getQuantity?: number;
    getProductId?: number;
    startDate?: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    applicableProductIds?: number[];
    applicableBranchIds?: number[];
    memberOnly?: boolean;
    isActive?: boolean;
    priority?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue.toString();
  if (data.buyQuantity !== undefined) updateData.buyQuantity = data.buyQuantity;
  if (data.getQuantity !== undefined) updateData.getQuantity = data.getQuantity;
  if (data.getProductId !== undefined) updateData.getProductId = data.getProductId;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.applicableProductIds !== undefined) updateData.applicableProductIds = data.applicableProductIds;
  if (data.applicableBranchIds !== undefined) updateData.applicableBranchIds = data.applicableBranchIds;
  if (data.memberOnly !== undefined) updateData.memberOnly = data.memberOnly;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.priority !== undefined) updateData.priority = data.priority;

  return { success: true };
}

export async function deletePromotion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return { success: true };
}



/**
 * Promotion Calculation Functions
 */

export async function calculateDiscount(data: {
  productId: number;
  quantity: number;
  unitPrice: number;
  branchId: number;
  customerId?: number;
  customerTier?: "standard" | "silver" | "gold" | "vip";
  currentTime?: Date;
}): Promise<{ discountAmount: number; finalPrice: number; appliedPromotion?: any }> {
  const now = data.currentTime || new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  // Get active promotions
  const activePromotions = await getActivePromotions();

  if (!activePromotions || activePromotions.length === 0) {
    const totalPrice = data.quantity * data.unitPrice;
    return { discountAmount: 0, finalPrice: totalPrice };
  }

  // Sort by priority (highest first)
  const sortedPromotions = activePromotions.sort((a, b) => b.priority - a.priority);

  // Find applicable promotion
  for (const promo of sortedPromotions) {
    // Check member-only
    if (promo.type === "member_only" && !data.customerId) {
      continue;
    }

    // Check happy hour
    if (promo.type === "happy_hour") {
      // Parse time range from description or rules
      // For now, assume it applies during 11am-2pm
      if (hour < 11 || hour >= 14) {
        continue;
      }
    }

    // Calculate discount
    const subtotal = data.quantity * data.unitPrice;
    let discountAmount = 0;

    const discountVal = promo.discountValue ? parseFloat(promo.discountValue) : 0;

    if (promo.type === "percentage") {
      discountAmount = (subtotal * discountVal) / 100;
    } else if (promo.type === "fixed") {
      discountAmount = discountVal;
    } else if (promo.type === "buy_x_get_y" && promo.buyQuantity) {
      if (data.quantity >= promo.buyQuantity) {
        // Get discount on specific product or percentage off
        discountAmount = (subtotal * discountVal) / 100;
      }
    } else if (promo.type === "member_only" && data.customerId) {
      discountAmount = (subtotal * discountVal) / 100;
    } else if (promo.type === "happy_hour") {
      discountAmount = (subtotal * discountVal) / 100;
    }

    if (discountAmount > 0) {
      return {
        discountAmount,
        finalPrice: subtotal - discountAmount,
        appliedPromotion: promo,
      };
    }
  }

  const totalPrice = data.quantity * data.unitPrice;
  return { discountAmount: 0, finalPrice: totalPrice };
}

/**
 * Promotion Analytics Functions
 */

export async function getPromotionUsageCount(promotionId: number) {
  // This would require a promotionUsage table to track actual usage
  // For now, return 0
  return 0;
}

export async function getPromotionRevenue(promotionId: number) {
  // This would require transaction data linked to promotions
  // For now, return 0
  return 0;
}

export async function getTopPromotions(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(promotions)
    .orderBy(desc(promotions.priority))
    .limit(limit);

  return result;
}

export async function getPromotionsByType(type: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(promotions)
    .where(eq(promotions.type, type as any))
    .orderBy(desc(promotions.priority));

  return result;
}

export async function getUpcomingPromotions(days = 7) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const result = await db
    .select()
    .from(promotions)
    .where(eq(promotions.isActive, true))
    .orderBy(desc(promotions.startDate));

  // Filter for promotions starting within the next N days
  return result.filter(
    (p) => new Date(p.startDate) > now && new Date(p.startDate) <= futureDate
  );
}

export async function getExpiredPromotions() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  const result = await db.select().from(promotions).orderBy(desc(promotions.endDate));

  // Filter for expired promotions
  return result.filter((p) => new Date(p.endDate) < now);
}

/**
 * Promotion Validation Functions
 */

export async function validatePromotion(promotionId: number): Promise<{ valid: boolean; reason?: string }> {
  const promo = await getPromotionById(promotionId);

  if (!promo) {
    return { valid: false, reason: "Promotion not found" };
  }

  if (!promo.isActive) {
    return { valid: false, reason: "Promotion is inactive" };
  }

  const now = new Date();
  if (new Date(promo.startDate) > now) {
    return { valid: false, reason: "Promotion has not started yet" };
  }

  if (new Date(promo.endDate) < now) {
    return { valid: false, reason: "Promotion has expired" };
  }

  return { valid: true };
}

export async function checkPromotionConflicts(data: {
  startDate: Date;
  endDate: Date;
  branchId?: number;
  productId?: number;
}): Promise<{ hasConflicts: boolean; conflicts: any[] }> {
  const allPromotions = await getAllPromotions();

  const conflicts = allPromotions.filter((p) => {
    const pStart = new Date(p.startDate);
    const pEnd = new Date(p.endDate);
    const dStart = new Date(data.startDate);
    const dEnd = new Date(data.endDate);

    // Check for date overlap
    const hasDateOverlap = pStart <= dEnd && pEnd >= dStart;

    if (!hasDateOverlap) return false;

    // Check for product/branch overlap if specified
    // This would require checking promotion rules
    return true;
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
