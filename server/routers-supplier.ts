import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  getActiveSuppliers,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  createPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrdersBySupplier,
  getPurchaseOrdersByBranch,
  getPurchaseOrdersByStatus,
  updatePurchaseOrder,
  getPendingPurchaseOrders,
  getOverdueOrders,
  getSupplierPurchaseHistory,
  getTotalPurchasesFromSupplier,
  getSupplierOrderCount,
  getAverageOrderValue,
  getTopSuppliers,
  getOutstandingInvoices,
  getRecentSuppliers,
  validateSupplier,
} from "./db-supplier";

export const supplierRouter = router({
  // Supplier CRUD
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        contactPerson: z.string().optional(),
        paymentTerms: z.string().optional(),
        isActive: z.boolean(),
      })
    )
    .mutation(({ input }) => createSupplier(input)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSupplierById(input.id)),

  getAll: protectedProcedure.query(() => getAllSuppliers()),

  getActive: protectedProcedure.query(() => getActiveSuppliers()),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        contactPerson: z.string().optional(),
        paymentTerms: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateSupplier(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSupplier(input.id)),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchSuppliers(input.query)),

  // Purchase Orders
  createPO: protectedProcedure
    .input(
      z.object({
        supplierId: z.number(),
        branchId: z.number(),
        poNumber: z.string(),
        totalAmount: z.number().positive(),
        status: z.enum(["draft", "pending", "received", "cancelled"]),
      })
    )
    .mutation(({ input, ctx }) =>
      createPurchaseOrder({
        ...input,
        createdBy: ctx.user.id,
      })
    ),

  getPOById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPurchaseOrderById(input.id)),

  getPOsBySupplier: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(({ input }) => getPurchaseOrdersBySupplier(input.supplierId)),

  getPOsByBranch: protectedProcedure
    .input(z.object({ branchId: z.number() }))
    .query(({ input }) => getPurchaseOrdersByBranch(input.branchId)),

  getPOsByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(({ input }) => getPurchaseOrdersByStatus(input.status)),

  updatePO: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "pending", "received", "cancelled"]).optional(),
        totalAmount: z.number().optional(),
        receivedAmount: z.number().optional(),
        outstandingAmount: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updatePurchaseOrder(id, data);
    }),

  getPendingPOs: protectedProcedure.query(() => getPendingPurchaseOrders()),

  getOverdueOrders: protectedProcedure.query(() => getOverdueOrders()),

  // Analytics
  getPurchaseHistory: protectedProcedure
    .input(z.object({ supplierId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getSupplierPurchaseHistory(input.supplierId, input.limit)),

  getTotalPurchases: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(({ input }) => getTotalPurchasesFromSupplier(input.supplierId)),

  getOrderCount: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(({ input }) => getSupplierOrderCount(input.supplierId)),

  getAverageOrderValue: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(({ input }) => getAverageOrderValue(input.supplierId)),

  getTopSuppliers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getTopSuppliers(input.limit)),

  getOutstandingInvoices: protectedProcedure
    .input(z.object({ supplierId: z.number().optional() }))
    .query(({ input }) => getOutstandingInvoices(input.supplierId)),

  getRecentSuppliers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getRecentSuppliers(input.limit)),

  // Validation
  validate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => validateSupplier(input.id)),
});
