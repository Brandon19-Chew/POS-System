import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createTransaction,
  getTransactionById,
  getTransactionsByBranch,
  getTransactionsByCashier,
  getTransactionsByCustomer,
  addTransactionItem,
  getTransactionItems,
  searchProductsForPOS,
  getProductByBarcode,
  getProductBySKU,
  holdTransaction,
  getHeldTransactionsByUser,
  getHeldTransactionById,
  resumeHeldTransaction,
  discardHeldTransaction,
  createRefund,
  getRefundsByTransaction,
  getTotalSalesByBranch,
  getTransactionCount,
  getAverageTransactionValue,
  getPaymentMethodBreakdown,
  getTopSellingProducts,
} from "./db-pos";
import { recordPurchase } from "./db-customer";

export const posRouter = router({
  /**
   * Product Search for POS
   */
  searchProducts: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchProductsForPOS(input.query);
    }),

  getProductByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      return getProductByBarcode(input.barcode);
    }),

  getProductBySKU: protectedProcedure
    .input(z.object({ sku: z.string() }))
    .query(async ({ input }) => {
      return getProductBySKU(input.sku);
    }),

  /**
   * Transaction Management
   */
  createTransaction: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        customerId: z.number().optional(),
        subtotal: z.string(),
        discountAmount: z.string(),
        taxAmount: z.string(),
        total: z.string(),
        amountPaid: z.string(),
        changeAmount: z.string(),
        paymentMethod: z.enum(["cash", "card", "ewallet", "mixed"]),
        pointsEarned: z.number().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
            unitPrice: z.string(),
            discountAmount: z.string(),
            taxAmount: z.string(),
            subtotal: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const txn = await createTransaction({
        branchId: input.branchId,
        cashierId: ctx.user!.id,
        customerId: input.customerId,
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        total: input.total,
        amountPaid: input.amountPaid,
        changeAmount: input.changeAmount,
        paymentMethod: input.paymentMethod,
        pointsEarned: input.pointsEarned,
        notes: input.notes,
      });

      // Generate a transaction ID for reference
      const transactionId = Math.floor(Math.random() * 1000000);

      // Add transaction items
      for (const item of input.items) {
        await addTransactionItem({
          transactionId: transactionId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
        });
      }

      // Record purchase and add loyalty points
      if (input.customerId && input.pointsEarned) {
        await recordPurchase({
          customerId: input.customerId,
          transactionId: transactionId,
          pointsEarned: input.pointsEarned,
        });
      }

      return { success: true, transactionId: transactionId };
    }),

  getTransaction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getTransactionById(input.id);
    }),

  getTransactionItems: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .query(async ({ input }) => {
      return getTransactionItems(input.transactionId);
    }),

  getTransactionsByBranch: protectedProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return getTransactionsByBranch(input.branchId, input.limit);
    }),

  getTransactionsByCashier: protectedProcedure
    .input(z.object({ cashierId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return getTransactionsByCashier(input.cashierId, input.limit);
    }),

  getTransactionsByCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      return getTransactionsByCustomer(input.customerId);
    }),

  /**
   * Hold & Resume Transactions
   */
  holdTransaction: protectedProcedure
    .input(
      z.object({
        transactionId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await holdTransaction(input.transactionId, ctx.user!.id, input.notes);
      return { success: true };
    }),

  getHeldTransactions: protectedProcedure.query(async ({ ctx }) => {
    return getHeldTransactionsByUser(ctx.user!.id);
  }),

  resumeHeldTransaction: protectedProcedure
    .input(z.object({ heldTransactionId: z.number() }))
    .query(async ({ input }) => {
      return resumeHeldTransaction(input.heldTransactionId);
    }),

  discardHeldTransaction: protectedProcedure
    .input(z.object({ heldTransactionId: z.number() }))
    .mutation(async ({ input }) => {
      await discardHeldTransaction(input.heldTransactionId);
      return { success: true };
    }),

  /**
   * Refunds
   */
  createRefund: protectedProcedure
    .input(
      z.object({
        transactionId: z.number(),
        reason: z.string(),
        refundAmount: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createRefund({
        transactionId: input.transactionId,
        reason: input.reason,
        refundAmount: input.refundAmount,
        processedBy: ctx.user!.id,
      });
      return { success: true };
    }),

  getRefunds: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .query(async ({ input }) => {
      return getRefundsByTransaction(input.transactionId);
    }),

  /**
   * POS Analytics
   */
  getTotalSales: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      return getTotalSalesByBranch(input.branchId);
    }),

  getTransactionCount: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      return getTransactionCount(input.branchId);
    }),

  getAverageTransactionValue: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      return getAverageTransactionValue(input.branchId);
    }),

  getPaymentMethodBreakdown: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input }) => {
      return getPaymentMethodBreakdown(input.branchId);
    }),

  getTopSellingProducts: protectedProcedure
    .input(z.object({ branchId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return getTopSellingProducts(input.branchId, input.limit);
    }),
});
