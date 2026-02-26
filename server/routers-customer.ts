import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createCustomer,
  getCustomerById,
  getAllCustomers,
  searchCustomers,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getCustomerTotalPoints,
  getCustomerPurchaseHistory,
  getCustomerTotalSpent,
  getCustomerPurchaseCount,
  updateCustomerTier,
  calculateCustomerTier,
  getRedemptionHistory,
} from "./db-customer";

export const customerRouter = router({
  /**
   * Customer CRUD Operations
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        tier: z.enum(["standard", "silver", "gold", "vip"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createCustomer(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCustomerById(input.id);
    }),

  list: protectedProcedure.query(async () => {
    return getAllCustomers();
  }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchCustomers(input.query);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        tier: z.enum(["standard", "silver", "gold", "vip"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCustomer(id, data);
      return getCustomerById(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCustomer(input.id);
      return { success: true };
    }),

  /**
   * Loyalty Points Operations
   */
  addPoints: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        points: z.number().positive(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await addLoyaltyPoints(input.customerId, input.points, input.description);
      return { success: true };
    }),

  redeemPoints: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        points: z.number().positive(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await redeemLoyaltyPoints(
        input.customerId,
        input.points,
        input.description
      );
      return { success: true };
    }),

  getTotalPoints: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getCustomerTotalPoints(input.customerId);
    }),

  /**
   * Purchase History Operations
   */
  getPurchaseHistory: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getCustomerPurchaseHistory(input.customerId);
    }),

  getTotalSpent: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getCustomerTotalSpent(input.customerId);
    }),

  getPurchaseCount: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getCustomerPurchaseCount(input.customerId);
    }),

  /**
   * Customer Tier Management
   */
  updateTier: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        tier: z.enum(["standard", "silver", "gold", "vip"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateCustomerTier(input.customerId, input.tier);
      return { success: true };
    }),

  calculateTier: protectedProcedure
    .input(z.object({ totalSpent: z.number() }))
    .query(async ({ input }) => {
      return calculateCustomerTier(input.totalSpent);
    }),

  /**
   * Redemption History
   */
  getRedemptionHistory: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getRedemptionHistory(input.customerId);
    }),
});
