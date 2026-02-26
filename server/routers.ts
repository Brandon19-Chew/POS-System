import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { categoryRouter, brandRouter, uomRouter, productRouter } from "./routers-product";
import { customerRouter } from "./routers-customer";
import { posRouter } from "./routers-pos";
import { warehouseRouter } from "./routers-warehouse";
import { promotionsRouter } from "./routers-promotions";
import { supplierRouter } from "./routers-supplier";
import { reportsRouter } from "./routers-reports";
import { settingsRouter } from "./routers-settings";
import { analyticsRouter } from "./routers-analytics";
import { forecastingRouter } from "./routers-forecasting";
import { adminRouter } from "./routers-admin";
import { authRouter } from "./routers-auth";
import { z } from "zod";
import {
  getAllUsers,
  getUserById,
  createAuditLog,
  getBranchById,
  getAllBranches,
  createBranch,
  getAllProducts,
  createProduct,
  getProductById,
  getProductBySku,
  getProductByBarcode,
  getAllCustomers,
  createCustomer,
  getCustomerById,
  getTransactionsByBranch,
  getActivePromotions,
  getBranchStockByBranch,
  getStockMovementsByProduct,
  getAuditLogs,
  getUserNotifications,
} from "./db";
import { requireAdmin, requireRole, requirePermission, requireBranchAccess } from "./auth";
import type { TrpcContext } from "./_core/context";
import { ResourceType, PermissionType } from "./auth";

// Extend permission checking to handle optional resource/permission
declare global {
  interface PermissionCheck {
    resource: ResourceType | "audit";
    permission: PermissionType;
  }
}

export const appRouter = router({
  system: systemRouter,
  customers: customerRouter,
  pos: posRouter,
  warehouse: warehouseRouter,
  promotions: promotionsRouter,
  suppliers: supplierRouter,
  reports: reportsRouter,
  settings: settingsRouter,
  admin: adminRouter,

  auth: authRouter,

  /**
   * User Management
   */
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requirePermission(ctx, "users", "view");
      return await getAllUsers();
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      requirePermission(ctx, "users", "view");
      return await getUserById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          role: z.enum(["admin", "manager", "cashier", "warehouse_staff", "user"]),
          branchId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requirePermission(ctx, "users", "create");
        // Note: In production, you'd create users through proper OAuth/invitation flow
        await createAuditLog({
          userId: ctx.user!.id,
          action: "CREATE_USER",
          entityType: "users",
          changes: { created: input },
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          role: z.enum(["admin", "manager", "cashier", "warehouse_staff", "user"]).optional(),
          branchId: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireAdmin(ctx);
        await createAuditLog({
          userId: ctx.user!.id,
          action: "UPDATE_USER",
          entityType: "users",
          entityId: input.id,
          changes: { updated: input },
        });
        return { success: true };
      }),
  }),

  /**
   * Branch Management
   */
  branches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requirePermission(ctx, "branches", "view");
      return await getAllBranches();
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      requirePermission(ctx, "branches", "view");
      return await getBranchById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          code: z.string(),
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          timezone: z.string().default("UTC"),
          currency: z.string().default("USD"),
          taxRate: z.string().default("0.00"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireAdmin(ctx);
        await createBranch({
          name: input.name,
          code: input.code,
          address: input.address,
          phone: input.phone,
          email: input.email,
          timezone: input.timezone,
          currency: input.currency,
          taxRate: input.taxRate as any,
        });
        await createAuditLog({
          userId: ctx.user!.id,
          action: "CREATE_BRANCH",
          entityType: "branches",
          changes: { created: input },
        });
        return { success: true };
      }),
  }),

  /**
   * Product Management
   */


  /**
   * Branch Stock & Inventory
   */
  inventory: router({
    getBranchStock: protectedProcedure
      .input(z.object({ branchId: z.number() }))
      .query(async ({ input, ctx }) => {
        requirePermission(ctx, "products", "view");
        requireBranchAccess(ctx, input.branchId);
        return await getBranchStockByBranch(input.branchId);
      }),

    getStockMovements: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        requirePermission(ctx, "products", "view");
        return await getStockMovementsByProduct(input.productId);
      }),
  }),

  /**
   * Transactions & Sales
   */
  transactions: router({
    getByBranch: protectedProcedure
      .input(z.object({ branchId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input, ctx }) => {
        requirePermission(ctx, "transactions", "view");
        requireBranchAccess(ctx, input.branchId);
        return await getTransactionsByBranch(input.branchId, input.limit);
      }),
  }),



  /**
   * Notifications
   */
  notifications: router({
    getForUser: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not found");
      return await getUserNotifications(ctx.user.id);
    }),
  }),

  /**
   * Audit & Compliance
   */
  audit: router({
    getLogs: protectedProcedure.input(z.object({ userId: z.number().optional() })).query(async ({ input, ctx }) => {
      requirePermission(ctx, "audit", "view");
      return await getAuditLogs(input?.userId);
    }),
  }),

  /**
   * Product Management
   */
  categories: categoryRouter,
  brands: brandRouter,
  uom: uomRouter,
  products: productRouter,

  /**
   * Advanced Analytics & AI Insights
   */
  analytics: analyticsRouter,

  /**
   * ML-Based Demand Forecasting
   */
  forecasting: forecastingRouter,
});

export type AppRouter = typeof appRouter;
