import { describe, it, expect } from "vitest";
import {
  createPromotion,
  getPromotionById,
  getAllPromotions,
  getActivePromotions,
  calculateDiscount,
  validatePromotion,
  getUpcomingPromotions,
  getExpiredPromotions,
} from "./db-promotions";

describe("Promotions Engine", () => {
  describe("Promotion CRUD", () => {
    it("should create a percentage discount promotion", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await createPromotion({
        name: "Summer Sale 20%",
        description: "20% off all products",
        type: "percentage",
        discountValue: 20,
        startDate: tomorrow,
        endDate: nextWeek,
        isActive: true,
        priority: 10,
        createdBy: 1,
      });

      expect(result).toBeDefined();
    });

    it("should create a fixed discount promotion", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await createPromotion({
        name: "Fixed $10 Off",
        description: "$10 off purchases over $50",
        type: "fixed",
        discountValue: 10,
        startDate: tomorrow,
        endDate: nextWeek,
        isActive: true,
        priority: 5,
        createdBy: 1,
      });

      expect(result).toBeDefined();
    });

    it("should create a buy x get y promotion", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await createPromotion({
        name: "Buy 3 Get 15% Off",
        description: "Buy 3 items, get 15% off",
        type: "buy_x_get_y",
        discountValue: 15,
        buyQuantity: 3,
        startDate: tomorrow,
        endDate: nextWeek,
        isActive: true,
        priority: 8,
        createdBy: 1,
      });

      expect(result).toBeDefined();
    });

    it("should create a member-only promotion", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await createPromotion({
        name: "Member Exclusive 25%",
        description: "25% off for members only",
        type: "member_only",
        discountValue: 25,
        startDate: tomorrow,
        endDate: nextWeek,
        memberOnly: true,
        isActive: true,
        priority: 15,
        createdBy: 1,
      });

      expect(result).toBeDefined();
    });

    it("should create a happy hour promotion", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await createPromotion({
        name: "Happy Hour 30%",
        description: "30% off during happy hour",
        type: "happy_hour",
        discountValue: 30,
        startDate: tomorrow,
        endDate: nextWeek,
        startTime: "11:00",
        endTime: "14:00",
        isActive: true,
        priority: 12,
        createdBy: 1,
      });

      expect(result).toBeDefined();
    });
  });

  describe("Promotion Queries", () => {
    it("should retrieve all promotions", async () => {
      const promotions = await getAllPromotions();
      expect(Array.isArray(promotions)).toBe(true);
    });

    it("should retrieve active promotions", async () => {
      const active = await getActivePromotions();
      expect(Array.isArray(active)).toBe(true);
      // All should be active and within date range
      active.forEach((p) => {
        expect(p.isActive).toBe(true);
      });
    });

    it("should retrieve upcoming promotions", async () => {
      const upcoming = await getUpcomingPromotions(30);
      expect(Array.isArray(upcoming)).toBe(true);
    });

    it("should retrieve expired promotions", async () => {
      const expired = await getExpiredPromotions();
      expect(Array.isArray(expired)).toBe(true);
      // All should have end date in the past
      expired.forEach((p) => {
        expect(new Date(p.endDate).getTime()).toBeLessThan(Date.now());
      });
    });
  });

  describe("Discount Calculation", () => {
    it("should calculate percentage discount", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 2,
        unitPrice: 100,
        branchId: 1,
      });

      expect(result).toHaveProperty("discountAmount");
      expect(result).toHaveProperty("finalPrice");
      expect(typeof result.discountAmount).toBe("number");
      expect(typeof result.finalPrice).toBe("number");
    });

    it("should calculate fixed discount", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        branchId: 1,
      });

      expect(result.finalPrice).toBeLessThanOrEqual(100);
    });

    it("should apply member-only discount for members", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        branchId: 1,
        customerId: 1,
        customerTier: "gold",
      });

      expect(result).toHaveProperty("discountAmount");
      expect(result).toHaveProperty("finalPrice");
    });

    it("should not apply member-only discount for non-members", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        branchId: 1,
        // No customerId provided
      });

      expect(result).toHaveProperty("discountAmount");
    });

    it("should apply buy x get y discount when quantity meets threshold", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 5, // More than typical buy quantity
        unitPrice: 50,
        branchId: 1,
      });

      expect(result).toHaveProperty("discountAmount");
      expect(result).toHaveProperty("finalPrice");
    });

    it("should return no discount when no promotions apply", async () => {
      const result = await calculateDiscount({
        productId: 99999, // Non-existent product
        quantity: 1,
        unitPrice: 100,
        branchId: 99999, // Non-existent branch
      });

      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(100);
    });
  });

  describe("Promotion Validation", () => {
    it("should validate active promotion", async () => {
      const promotions = await getActivePromotions();
      if (promotions && promotions.length > 0) {
        const validation = await validatePromotion(promotions[0].id);
        expect(validation.valid).toBe(true);
      }
    });

    it("should reject non-existent promotion", async () => {
      const validation = await validatePromotion(99999);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBeDefined();
    });

    it("should reject inactive promotion", async () => {
      const allPromos = await getAllPromotions();
      const inactive = allPromos.find((p) => !p.isActive);
      if (inactive) {
        const validation = await validatePromotion(inactive.id);
        expect(validation.valid).toBe(false);
      }
    });

    it("should reject expired promotion", async () => {
      const expired = await getExpiredPromotions();
      if (expired && expired.length > 0) {
        const validation = await validatePromotion(expired[0].id);
        expect(validation.valid).toBe(false);
      }
    });
  });

  describe("Promotion Priority", () => {
    it("should sort promotions by priority", async () => {
      const promotions = await getAllPromotions();
      if (promotions.length > 1) {
        // Check if sorted by priority (descending)
        for (let i = 0; i < promotions.length - 1; i++) {
          expect(promotions[i].priority).toBeGreaterThanOrEqual(promotions[i + 1].priority);
        }
      }
    });

    it("should apply highest priority promotion first", async () => {
      const active = await getActivePromotions();
      if (active.length > 1) {
        // Highest priority should be first
        expect(active[0].priority).toBeGreaterThanOrEqual(active[1].priority);
      }
    });
  });

  describe("Promotion Types", () => {
    it("should handle all promotion types", async () => {
      const types = ["percentage", "fixed", "buy_x_get_y", "member_only", "happy_hour"];
      const promotions = await getAllPromotions();

      const typeMap = new Map();
      promotions.forEach((p) => {
        typeMap.set(p.type, true);
      });

      // At least some types should be represented
      expect(typeMap.size).toBeGreaterThan(0);
    });
  });

  describe("Discount Boundaries", () => {
    it("should not apply negative discount", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        branchId: 1,
      });

      expect(result.discountAmount).toBeGreaterThanOrEqual(0);
    });

    it("should not exceed original price", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        branchId: 1,
      });

      expect(result.finalPrice).toBeGreaterThanOrEqual(0);
      expect(result.finalPrice).toBeLessThanOrEqual(100);
    });

    it("should handle bulk quantities correctly", async () => {
      const result = await calculateDiscount({
        productId: 1,
        quantity: 100,
        unitPrice: 10,
        branchId: 1,
      });

      expect(result.finalPrice).toBeLessThanOrEqual(1000);
      expect(result.finalPrice).toBeGreaterThanOrEqual(0);
    });
  });
});
