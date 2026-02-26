import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getSystemSettings,
  updateSystemSettings,
  logAuditEvent,
  getAuditLogs,
  getAuditLogStats,
  createSystemBackup,
  getBackupHistory,
  restoreFromBackup,
  getSystemHealth,
  exportSettingsAsJSON,
  importSettingsFromJSON,
} from "./db-settings";

export const settingsRouter = router({
  // System Settings
  getSystemSettings: protectedProcedure.query(() => getSystemSettings()),

  updateSystemSettings: protectedProcedure
    .input(
      z.object({
        taxRate: z.number().optional(),
        taxName: z.string().optional(),
        currencyCode: z.string().optional(),
        currencySymbol: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        timeFormat: z.string().optional(),
        receiptHeader: z.string().optional(),
        receiptFooter: z.string().optional(),
        receiptShowLogo: z.boolean().optional(),
        receiptShowItemDetails: z.boolean().optional(),
        receiptShowTaxBreakdown: z.boolean().optional(),
        receiptShowPaymentMethod: z.boolean().optional(),
        receiptShowCustomerInfo: z.boolean().optional(),
        receiptShowPromotions: z.boolean().optional(),
        businessName: z.string().optional(),
        businessAddress: z.string().optional(),
        businessPhone: z.string().optional(),
        businessEmail: z.string().optional(),
        businessWebsite: z.string().optional(),
        businessLogo: z.string().optional(),
        businessRegistration: z.string().optional(),
        decimalPlaces: z.number().optional(),
        enableLoyaltyPoints: z.boolean().optional(),
        enablePromotions: z.boolean().optional(),
        enableMultiBranch: z.boolean().optional(),
        maintenanceMode: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await updateSystemSettings(input);

      // Log the change
      await logAuditEvent(
        ctx.user!.id,
        "UPDATE",
        "SYSTEM_SETTINGS",
        1,
        input,
        ctx.req.headers["x-forwarded-for"] as string
      );

      return result;
    }),

  // Audit Logs
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(({ input }) =>
      getAuditLogs(input.limit, input.offset, {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
      })
    ),

  getAuditLogStats: protectedProcedure.query(() => getAuditLogStats()),

  // Backup & Restore
  createBackup: protectedProcedure.mutation(async ({ ctx }) => {
    const backup = await createSystemBackup();

    // Log the backup
    await logAuditEvent(
      ctx.user!.id,
      "CREATE_BACKUP",
      "SYSTEM",
      1,
      { backupId: backup?.backupId },
      ctx.req.headers["x-forwarded-for"] as string
    );

    return backup;
  }),

  getBackupHistory: protectedProcedure.query(() => getBackupHistory()),

  restoreBackup: protectedProcedure
    .input(z.object({ backupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await restoreFromBackup(input.backupId);

      // Log the restore
      await logAuditEvent(
        ctx.user!.id,
        "RESTORE_BACKUP",
        "SYSTEM",
        1,
        { backupId: input.backupId },
        ctx.req.headers["x-forwarded-for"] as string
      );

      return result;
    }),

  // System Health
  getSystemHealth: protectedProcedure.query(() => getSystemHealth()),

  // Export/Import
  exportSettings: protectedProcedure.query(() => exportSettingsAsJSON()),

  importSettings: protectedProcedure
    .input(z.object({ data: z.any() }))
    .mutation(async ({ input, ctx }) => {
      const result = await importSettingsFromJSON(input.data);

      // Log the import
      await logAuditEvent(
        ctx.user!.id,
        "IMPORT_SETTINGS",
        "SYSTEM",
        1,
        { success: result.success },
        ctx.req.headers["x-forwarded-for"] as string
      );

      return result;
    }),
});
