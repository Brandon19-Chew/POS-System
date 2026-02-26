import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createPromotion,
  getPromotionById,
  getAllPromotions,
  getActivePromotions,
  getPromotionsByBranch,
  getPromotionsByProduct,
  updatePromotion,
  deletePromotion,
  calculateDiscount,
  getPromotionUsageCount,
  getPromotionRevenue,
  getTopPromotions,
  getPromotionsByType,
  getUpcomingPromotions,
  getExpiredPromotions,
  validatePromotion,
  checkPromotionConflicts,
} from "./db-promotions";

export const promotionsRouter = router({
  // Promotion CRUD
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["percentage", "fixed", "buy_x_get_y", "member_only", "happy_hour"]),
        discountValue: z.number().positive(),
        buyQuantity: z.number().optional(),
        getQuantity: z.number().optional(),
        getProductId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        applicableProductIds: z.array(z.number()).optional(),
        applicableBranchIds: z.array(z.number()).optional(),
        memberOnly: z.boolean().optional(),
        isActive: z.boolean(),
        priority: z.number(),
      })
    )
    .mutation(({ input, ctx }) =>
      createPromotion({
        ...input,
        createdBy: ctx.user.id,
      })
    ),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPromotionById(input.id)),

  getAll: protectedProcedure.query(() => getAllPromotions()),

  getActive: protectedProcedure.query(() => getActivePromotions()),

  getByBranch: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getPromotionsByBranch(input.branchId)),

  getByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(({ input }) => getPromotionsByProduct(input.productId)),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        discountValue: z.number().optional(),
        buyQuantity: z.number().optional(),
        getQuantity: z.number().optional(),
        getProductId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        applicableProductIds: z.array(z.number()).optional(),
        applicableBranchIds: z.array(z.number()).optional(),
        memberOnly: z.boolean().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updatePromotion(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePromotion(input.id)),

  // Promotion Queries
  getTopPromotions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getTopPromotions(input.limit)),

  getByType: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(({ input }) => getPromotionsByType(input.type)),

  getUpcoming: protectedProcedure
    .input(z.object({ days: z.number().optional() }))
    .query(({ input }) => getUpcomingPromotions(input.days)),

  getExpired: protectedProcedure.query(() => getExpiredPromotions()),

  // Promotion Validation
  validate: protectedProcedure
    .input(z.object({ promotionId: z.number() }))
    .query(({ input }) => validatePromotion(input.promotionId)),

  checkConflicts: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        branchId: z.number().optional(),
        productId: z.number().optional(),
      })
    )
    .query(({ input }) => checkPromotionConflicts(input)),

  // Discount Calculation
  calculateDiscount: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        branchId: z.number(),
        customerId: z.number().optional(),
        customerTier: z.enum(["standard", "silver", "gold", "vip"]).optional(),
        currentTime: z.date().optional(),
      })
    )
    .query(({ input }) => calculateDiscount(input)),

  // Analytics
  getUsageCount: protectedProcedure
    .input(z.object({ promotionId: z.number() }))
    .query(({ input }) => getPromotionUsageCount(input.promotionId)),

  getRevenue: protectedProcedure
    .input(z.object({ promotionId: z.number() }))
    .query(({ input }) => getPromotionRevenue(input.promotionId)),
});
