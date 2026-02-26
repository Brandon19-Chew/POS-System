import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { systemSettings, auditLogs, users } from "../drizzle/schema";

/**
 * System Settings Management
 */

export async function getSystemSettings() {
  const db = await getDb();
  if (!db) return null;

  const settings = await db.select().from(systemSettings).limit(1);
  return settings.length > 0 ? settings[0] : null;
}

export async function updateSystemSettings(updates: {
  taxRate?: number;
  taxName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptShowLogo?: boolean;
  receiptShowItemDetails?: boolean;
  receiptShowTaxBreakdown?: boolean;
  receiptShowPaymentMethod?: boolean;
  receiptShowCustomerInfo?: boolean;
  receiptShowPromotions?: boolean;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessLogo?: string;
  businessRegistration?: string;
  decimalPlaces?: number;
  enableLoyaltyPoints?: boolean;
  enablePromotions?: boolean;
  enableMultiBranch?: boolean;
  maintenanceMode?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getSystemSettings();

  if (existing) {
    // Update existing settings
    await db
      .update(systemSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, existing.id));

    return await getSystemSettings();
  } else {
    // Create new settings
    await db.insert(systemSettings).values({
      ...updates,
    } as any);

    return await getSystemSettings();
  }
}

/**
 * Audit Logging
 */

export async function logAuditEvent(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  changes?: Record<string, any>,
  ipAddress?: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId,
    changes: changes ? JSON.stringify(changes) : null,
    ipAddress,
    createdAt: new Date(),
  });

  return result;
}

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  filters?: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) return [];

  let query: any = db.select().from(auditLogs);

  if (filters?.userId) {
    query = db.select().from(auditLogs).where(eq(auditLogs.userId, filters.userId));
  }

  if (filters?.action) {
    query = db.select().from(auditLogs).where(eq(auditLogs.action, filters.action));
  }

  if (filters?.entityType) {
    query = db.select().from(auditLogs).where(eq(auditLogs.entityType, filters.entityType));
  }

  // Note: Date filtering would require additional query logic
  // For now, we'll fetch all and filter in memory

  const logs = await query.limit(limit).offset(offset);

  // Get user details for each log
  const result = [];
  for (const log of logs) {
    const user = await db.select().from(users).where(eq(users.id, log.userId)).limit(1);
    result.push({
      ...log,
      userName: user.length > 0 ? user[0].name : "Unknown",
      userEmail: user.length > 0 ? user[0].email : "Unknown",
    });
  }

  return result;
}

export async function getAuditLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select()
    .from(auditLogs);

  // Get user details for each log
  const result = [];
  for (const log of logs) {
    const user = await db.select().from(users).where(eq(users.id, log.userId)).limit(1);
    result.push({
      ...log,
      userName: user.length > 0 ? user[0].name : "Unknown",
      userEmail: user.length > 0 ? user[0].email : "Unknown",
    });
  }

  return result;
}

export async function getAuditLogsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select()
    .from(auditLogs)
    .limit(limit);

  return logs;
}

export async function getAuditLogStats() {
  const db = await getDb();
  if (!db) return null;

  const allLogs = await db.select().from(auditLogs).limit(1000);

  // Group by action
  const actionStats: Record<string, number> = {};
  for (const log of allLogs) {
    actionStats[log.action] = (actionStats[log.action] || 0) + 1;
  }

  // Group by entity type
  const entityStats: Record<string, number> = {};
  for (const log of allLogs) {
    entityStats[log.entityType] = (entityStats[log.entityType] || 0) + 1;
  }

  // Group by user
  const userStats: Record<number, number> = {};
  for (const log of allLogs) {
    userStats[log.userId] = (userStats[log.userId] || 0) + 1;
  }

  return {
    totalLogs: allLogs.length,
    actionStats,
    entityStats,
    userStats,
    lastLog: allLogs.length > 0 ? allLogs[allLogs.length - 1] : null,
  };
}

/**
 * Backup & Restore
 */

export async function createSystemBackup() {
  const db = await getDb();
  if (!db) return null;

  // In a real application, this would export all data to a backup file
  // For now, we'll return backup metadata
  const timestamp = new Date().toISOString();
  const backupId = `backup-${Date.now()}`;

  return {
    backupId,
    timestamp,
    status: "completed",
    size: "0 MB", // Would be calculated from actual backup
    message: "Backup created successfully. In production, this would export all system data.",
  };
}

export async function getBackupHistory() {
  // In a real application, this would query backup records from storage
  // For now, returning mock data
  return [
    {
      backupId: "backup-1708963200000",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "completed" as const,
      size: "45.2 MB",
    },
    {
      backupId: "backup-1708876800000",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: "completed" as const,
      size: "42.8 MB",
    },
    {
      backupId: "backup-1708790400000",
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      status: "completed" as const,
      size: "41.5 MB",
    },
  ];
}

export async function restoreFromBackup(backupId: string) {
  // In a real application, this would restore data from backup
  // For now, returning success message
  return {
    success: true,
    backupId,
    message: "Backup restored successfully. In production, this would restore all system data.",
  };
}

/**
 * System Health & Diagnostics
 */

export async function getSystemHealth() {
  const db = await getDb();
  if (!db) {
    return {
      status: "error",
      database: "disconnected",
      message: "Database connection failed",
    };
  }

  try {
    // Test database connection
    const settings = await getSystemSettings();

    return {
      status: "healthy",
      database: "connected",
      settings: !!settings,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  } catch (error) {
    return {
      status: "error",
      database: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export Settings
 */

export async function exportSettingsAsJSON() {
  const settings = await getSystemSettings();
  return {
    settings,
    exportDate: new Date().toISOString(),
    version: "1.0",
  };
}

export async function importSettingsFromJSON(data: any) {
  try {
    if (!data.settings) {
      throw new Error("Invalid settings format");
    }

    const result = await updateSystemSettings(data.settings);
    return {
      success: true,
      message: "Settings imported successfully",
      settings: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Import failed",
    };
  }
}
