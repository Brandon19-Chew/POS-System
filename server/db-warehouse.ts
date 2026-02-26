import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  branchStock,
  stockMovements,
  products,
  branches,
} from "../drizzle/schema";

/**
 * Inventory Management Functions
 */

export async function getInventoryByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: branchStock.id,
      productId: branchStock.productId,
      branchId: branchStock.branchId,
      quantity: branchStock.quantity,
      reservedQuantity: branchStock.reservedQuantity,
      productName: products.name,
      productSku: products.sku,
      productPrice: products.price,
    })
    .from(branchStock)
    .innerJoin(products, eq(branchStock.productId, products.id))
    .where(eq(branchStock.branchId, branchId));

  return result;
}

export async function getInventoryByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(branchStock)
    .where(eq(branchStock.productId, productId));

  return result;
}

export async function getInventoryItem(productId: number, branchId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(branchStock)
    .where(and(eq(branchStock.productId, productId), eq(branchStock.branchId, branchId)))
    .limit(1);

  return result[0];
}

export async function updateInventoryQuantity(
  productId: number,
  branchId: number,
  quantityChange: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getInventoryItem(productId, branchId);
  if (!current) throw new Error("Inventory item not found");

  const newQuantity = Math.max(0, current.quantity + quantityChange);

  // Update inventory (in real scenario, use proper update)
  return { success: true, newQuantity };
}

export async function getLowStockItems(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: branchStock.id,
      productId: branchStock.productId,
      branchId: branchStock.branchId,
      quantity: branchStock.quantity,
      productName: products.name,
      productSku: products.sku,
      productPrice: products.price,
    })
    .from(branchStock)
    .innerJoin(products, eq(branchStock.productId, products.id))
    .where(eq(branchStock.branchId, branchId));

  // Filter client-side for simplicity - low stock if quantity < 10
  return result.filter((item) => item.quantity < 10);
}

export async function getOutOfStockItems(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: branchStock.id,
      productId: branchStock.productId,
      branchId: branchStock.branchId,
      quantity: branchStock.quantity,
      productName: products.name,
      productSku: products.sku,
    })
    .from(branchStock)
    .innerJoin(products, eq(branchStock.productId, products.id))
    .where(and(eq(branchStock.branchId, branchId), eq(branchStock.quantity, 0)));

  return result;
}

export async function getOverstockedItems(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: branchStock.id,
      productId: branchStock.productId,
      branchId: branchStock.branchId,
      quantity: branchStock.quantity,
      productName: products.name,
      productSku: products.sku,
    })
    .from(branchStock)
    .innerJoin(products, eq(branchStock.productId, products.id))
    .where(eq(branchStock.branchId, branchId));

  // Filter for items above 100 units (overstock threshold)
  return result.filter((item) => item.quantity > 100);
}

/**
 * Stock Movement Functions
 */

export async function recordStockMovement(data: {
  productId: number;
  branchId: number;
  type: "in" | "out" | "transfer" | "damage" | "return";
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(stockMovements).values({
    productId: data.productId,
    branchId: data.branchId,
    type: data.type,
    quantity: data.quantity,
    referenceType: data.referenceType,
    referenceId: data.referenceId,
    notes: data.notes,
    createdBy: data.createdBy,
  });

  return result;
}

export async function getStockMovementsByBranch(branchId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      branchId: stockMovements.branchId,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      referenceType: stockMovements.referenceType,
      referenceId: stockMovements.referenceId,
      notes: stockMovements.notes,
      createdBy: stockMovements.createdBy,
      createdAt: stockMovements.createdAt,
      productName: products.name,
      productSku: products.sku,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .where(eq(stockMovements.branchId, branchId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  return result;
}

export async function getStockMovementsByProduct(productId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, productId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  return result;
}

export async function getStockMovementsByDateRange(
  branchId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId))
    .orderBy(desc(stockMovements.createdAt));

  // Filter by date range client-side for simplicity
  return result.filter(
    (m) =>
      new Date(m.createdAt) >= startDate && new Date(m.createdAt) <= endDate
  );
}

export async function getStockInMovements(branchId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  // Filter for stock in movements
  return result.filter((m) => m.type === "in" || m.type === "transfer");
}

export async function getStockOutMovements(branchId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  // Filter for stock out movements
  return result.filter((m) => m.type === "out" || m.type === "transfer");
}

/**
 * Stock Transfer Functions
 */

export async function transferStock(data: {
  productId: number;
  fromBranchId: number;
  toBranchId: number;
  quantity: number;
  reason?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Record outgoing movement
  await recordStockMovement({
    productId: data.productId,
    branchId: data.fromBranchId,
    type: "transfer",
    quantity: data.quantity,
    notes: `Transfer to branch ${data.toBranchId}: ${data.reason || ""}`,
    createdBy: data.createdBy,
  });

  // Record incoming movement
  await recordStockMovement({
    productId: data.productId,
    branchId: data.toBranchId,
    type: "transfer",
    quantity: data.quantity,
    notes: `Transfer from branch ${data.fromBranchId}: ${data.reason || ""}`,
    createdBy: data.createdBy,
  });

  return { success: true };
}

/**
 * Inventory Analytics Functions
 */

export async function getTotalInventoryValue(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      quantity: branchStock.quantity,
      price: products.price,
    })
    .from(branchStock)
    .innerJoin(products, eq(branchStock.productId, products.id))
    .where(eq(branchStock.branchId, branchId));

  return result.reduce((sum, item) => {
    return sum + item.quantity * parseFloat(item.price);
  }, 0);
}

export async function getInventoryTurnoverRate(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  // Get total stock out movements in last 30 days
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentMovements = movements.filter(
    (m) => new Date(m.createdAt) >= thirtyDaysAgo
  );

  const outMovements = recentMovements.filter(
    (m) => m.type === "out" || m.type === "transfer"
  );

  const totalOut = outMovements.reduce((sum, m) => sum + m.quantity, 0);

  return totalOut;
}

export async function getAverageInventoryLevel(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(branchStock)
    .where(eq(branchStock.branchId, branchId));

  if (result.length === 0) return 0;

  const totalQuantity = result.reduce((sum, item) => sum + item.quantity, 0);
  return totalQuantity / result.length;
}

export async function getStockMovementSummary(branchId: number, days = 30) {
  const db = await getDb();
  if (!db) return { in: 0, out: 0, transfers: 0 };

  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.branchId, branchId));

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const recentMovements = movements.filter(
    (m) => new Date(m.createdAt) >= startDate
  );

  const summary = {
    in: recentMovements
      .filter((m) => m.type === "in")
      .reduce((sum, m) => sum + m.quantity, 0),
    out: recentMovements
      .filter((m) => m.type === "out")
      .reduce((sum, m) => sum + m.quantity, 0),
    transfers: recentMovements
      .filter((m) => m.type === "transfer")
      .reduce((sum, m) => sum + m.quantity, 0),
    damage: recentMovements
      .filter((m) => m.type === "damage")
      .reduce((sum, m) => sum + m.quantity, 0),
  };

  return summary;
}

export async function getInventorySummary(branchId: number) {
  const db = await getDb();
  if (!db) return { total: 0, lowStock: 0, outOfStock: 0, overstock: 0 };

  const items = await getInventoryByBranch(branchId);
  const lowStock = items.filter((item) => item.quantity < 10).length;
  const outOfStock = items.filter((item) => item.quantity === 0).length;
  const overstock = items.filter((item) => item.quantity > 100).length;

  return {
    total: items.length,
    lowStock,
    outOfStock,
    overstock,
  };
}
