import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  calculateSalesVelocity,
  predictDemand,
  calculateOptimalReorderPoint,
  getProductsNeedingReorder,
  calculateForecastAccuracy,
  getDemandTrends,
  getSeasonalPatterns,
  getInventoryOptimizationRecommendations,
} from "./db-forecasting";
import { requirePermission } from "./auth";

export const forecastingRouter = router({
  /**
   * Get sales velocity for a product
   */
  getSalesVelocity: protectedProcedure
    .input(z.object({ productId: z.number(), days: z.number().default(90) }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await calculateSalesVelocity(input.productId, input.days);
    }),

  /**
   * Predict demand for next N days
   */
  predictDemand: protectedProcedure
    .input(z.object({ productId: z.number(), forecastDays: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await predictDemand(input.productId, input.forecastDays);
    }),

  /**
   * Calculate optimal reorder point and quantity
   */
  getOptimalReorderPoint: protectedProcedure
    .input(z.object({ productId: z.number(), leadTimeDays: z.number().default(7), safetyStock: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await calculateOptimalReorderPoint(input.productId, input.leadTimeDays, input.safetyStock);
    }),

  /**
   * Get products that need reordering
   */
  getProductsNeedingReorder: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getProductsNeedingReorder();
  }),

  /**
   * Calculate forecast accuracy metrics
   */
  getForecastAccuracy: protectedProcedure
    .input(z.object({ productId: z.number(), daysBack: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await calculateForecastAccuracy(input.productId, input.daysBack);
    }),

  /**
   * Get demand trends for a product
   */
  getDemandTrends: protectedProcedure
    .input(z.object({ productId: z.number(), weeks: z.number().default(12) }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getDemandTrends(input.productId, input.weeks);
    }),

  /**
   * Get seasonal patterns for a product
   */
  getSeasonalPatterns: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "products", "view");
      return await getSeasonalPatterns(input.productId);
    }),

  /**
   * Get inventory optimization recommendations
   */
  getOptimizationRecommendations: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "products", "view");
    return await getInventoryOptimizationRecommendations();
  }),
});
