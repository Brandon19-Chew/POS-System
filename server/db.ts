import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  branches,
  categories,
  brands,
  unitOfMeasures,
  products,
  branchStock,
  customers,
  suppliers,
  transactions,
  transactionItems,
  promotions,
  auditLogs,
  systemSettings,
  stockMovements,
  loyaltyTransactions,
  notifications,
  refunds,
  purchaseOrders,
  purchaseOrderItems,
  heldTransactions,
  adminVerificationCodes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.isActive, true));
}

/**
 * Branch Management
 */
export async function createBranch(data: typeof branches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(branches).values(data);
  return result;
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBranches() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branches).where(eq(branches.isActive, true));
}

/**
 * Product Management
 */
export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductBySku(sku: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.isActive, true));
}

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];
  // Simple search - can be enhanced with full-text search
  return await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
      )
    )
    .limit(50);
}

/**
 * Branch Stock Management
 */
export async function getBranchStock(branchId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(branchStock)
    .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, productId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBranchStock(branchId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getBranchStock(branchId, productId);
  if (existing) {
    await db
      .update(branchStock)
      .set({ quantity })
      .where(and(eq(branchStock.branchId, branchId), eq(branchStock.productId, productId)));
  } else {
    await db.insert(branchStock).values({
      branchId,
      productId,
      quantity,
    });
  }
}

export async function getBranchStockByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branchStock).where(eq(branchStock.branchId, branchId));
}

/**
 * Customer Management
 */
export async function createCustomer(data: typeof customers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(data);
  return result;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).where(eq(customers.isActive, true));
}

/**
 * Transaction Management
 */
export async function createTransaction(data: typeof transactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data);
  return result;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTransactionsByBranch(branchId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

/**
 * Audit Log Management
 */
export async function createAuditLog(data: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

export async function getAuditLogs(userId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
  
  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * System Settings
 */
export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setSystemSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSystemSetting(key);
  if (existing) {
    await db
      .update(systemSettings)
      .set({ value, description })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value, description });
  }
}

/**
 * Promotion Management
 */
export async function getActivePromotions(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now)
      )
    )
    .orderBy(desc(promotions.priority));
}

/**
 * Notification Management
 */
export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return;
  }
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

/**
 * Stock Movement Tracking
 */
export async function createStockMovement(data: typeof stockMovements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockMovements).values(data);
  return result;
}

export async function getStockMovementsByProduct(productId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, productId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

/**
 * Loyalty Transaction Management
 */
export async function createLoyaltyTransaction(data: typeof loyaltyTransactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(loyaltyTransactions).values(data);
  return result;
}

export async function getCustomerLoyaltyTransactions(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.customerId, customerId))
    .orderBy(desc(loyaltyTransactions.createdAt));
}
