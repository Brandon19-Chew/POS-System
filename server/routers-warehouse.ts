import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getInventoryByBranch,
  getInventoryByProduct,
  getLowStockItems,
  getOutOfStockItems,
  getOverstockedItems,
  getStockMovementsByBranch,
  getStockMovementsByProduct,
  getStockMovementsByDateRange,
  getStockInMovements,
  getStockOutMovements,
  recordStockMovement,
  transferStock,
  getTotalInventoryValue,
  getInventoryTurnoverRate,
  getAverageInventoryLevel,
  getStockMovementSummary,
  getInventorySummary,
} from "./db-warehouse";

export const warehouseRouter = router({
  // Inventory queries
  getInventoryByBranch: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getInventoryByBranch(input.branchId)),

  getInventoryByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(({ input }) => getInventoryByProduct(input.productId)),

  getLowStockItems: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getLowStockItems(input.branchId)),

  getOutOfStockItems: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getOutOfStockItems(input.branchId)),

  getOverstockedItems: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getOverstockedItems(input.branchId)),

  getInventorySummary: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getInventorySummary(input.branchId)),

  getTotalInventoryValue: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getTotalInventoryValue(input.branchId)),

  getAverageInventoryLevel: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getAverageInventoryLevel(input.branchId)),

  // Stock movements
  getStockMovementsByBranch: protectedProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getStockMovementsByBranch(input.branchId, input.limit)),

  getStockMovementsByProduct: protectedProcedure
    .input(z.object({ productId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getStockMovementsByProduct(input.productId, input.limit)),

  getStockMovementsByDateRange: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(({ input }) =>
      getStockMovementsByDateRange(input.branchId, input.startDate, input.endDate)
    ),

  getStockInMovements: protectedProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getStockInMovements(input.branchId, input.limit)),

  getStockOutMovements: protectedProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getStockOutMovements(input.branchId, input.limit)),

  getStockMovementSummary: protectedProcedure
    .input(z.object({ branchId: z.number(), days: z.number().optional() }))
    .query(({ input }) => getStockMovementSummary(input.branchId, input.days)),

  getInventoryTurnoverRate: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getInventoryTurnoverRate(input.branchId)),

  // Stock mutations
  recordStockMovement: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        branchId: z.number(),
        type: z.enum(["in", "out", "transfer", "damage", "return"]),
        quantity: z.number(),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) =>
      recordStockMovement({
        ...input,
        createdBy: ctx.user.id,
      })
    ),

  transferStock: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        fromBranchId: z.number(),
        toBranchId: z.number(),
        quantity: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) =>
      transferStock({
        ...input,
        createdBy: ctx.user.id,
      })
    ),
});
