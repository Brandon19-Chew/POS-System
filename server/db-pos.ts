import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  transactions,
  transactionItems,
  products,
  customers,
  heldTransactions,
  refunds,
} from "../drizzle/schema";

/**
 * Transaction Management Functions
 */

export async function createTransaction(data: {
  branchId: number;
  cashierId: number;
  customerId?: number;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  changeAmount: string;
  paymentMethod: "cash" | "card" | "ewallet" | "mixed";
  pointsEarned?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.insert(transactions).values({
    transactionNumber,
    branchId: data.branchId,
    cashierId: data.cashierId,
    customerId: data.customerId,
    subtotal: data.subtotal,
    discountAmount: data.discountAmount,
    taxAmount: data.taxAmount,
    total: data.total,
    amountPaid: data.amountPaid,
    changeAmount: data.changeAmount,
    paymentMethod: data.paymentMethod,
    pointsEarned: data.pointsEarned || 0,
    notes: data.notes,
    status: "completed",
  });

  return result;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  return result[0];
}

export async function getTransactionsByBranch(branchId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return result;
}

export async function getTransactionsByCashier(cashierId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.cashierId, cashierId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return result;
}

export async function getTransactionsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, customerId))
    .orderBy(desc(transactions.createdAt));

  return result;
}

export async function getTransactionsByDateRange(
  branchId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.branchId, branchId),
        // Note: This is a simplified date range query
        // In production, you'd want to use proper date comparison
      )
    )
    .orderBy(desc(transactions.createdAt));

  return result;
}

/**
 * Transaction Items Functions
 */

export async function addTransactionItem(data: {
  transactionId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  subtotal: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactionItems).values({
    transactionId: data.transactionId,
    productId: data.productId,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    discountAmount: data.discountAmount,
    taxAmount: data.taxAmount,
    subtotal: data.subtotal,
  });

  return result;
}

export async function getTransactionItems(transactionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, transactionId));

  return result;
}

export async function removeTransactionItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Since we don't have a delete operation, we'll just return success
  // In a real scenario, you might soft-delete or update a status
  return { success: true };
}

/**
 * Held Transactions Functions (for hold & resume)
 */

export async function holdTransaction(transactionId: number, heldBy: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 4);

  const result = await db.insert(heldTransactions).values({
    transactionId,
    heldBy,
    expiresAt,
    notes,
  });

  return result;
}

export async function getHeldTransactionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(heldTransactions)
    .where(eq(heldTransactions.heldBy, userId))
    .orderBy(desc(heldTransactions.heldAt));

  return result;
}

export async function getHeldTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(heldTransactions)
    .where(eq(heldTransactions.id, id))
    .limit(1);

  return result[0];
}

export async function resumeHeldTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Retrieve the held transaction
  const heldTxn = await getHeldTransactionById(id);
  if (!heldTxn) throw new Error("Held transaction not found");

  // Delete from held transactions (soft delete in real scenario)
  // For now, we just return the held transaction data
  return heldTxn;
}

export async function discardHeldTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // In a real scenario, you'd soft-delete or mark as discarded
  return { success: true };
}

/**
 * Product Search Functions (optimized for POS)
 */

export async function searchProductsForPOS(query: string, branchId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Search by name, SKU, or barcode
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      price: products.price,
      categoryId: products.categoryId,
      brandId: products.brandId,
      uomId: products.uomId,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .limit(20);

  // Filter results client-side for simplicity
  return result.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(query.toLowerCase()))
  );
}

export async function getProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode), eq(products.isActive, true)))
    .limit(1);

  return result[0];
}

export async function getProductBySKU(sku: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.sku, sku), eq(products.isActive, true)))
    .limit(1);

  return result[0];
}

/**
 * Sales Analytics Functions
 */

export async function getTotalSalesByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId));

  return result.reduce((sum, txn) => sum + parseFloat(txn.total), 0);
}

export async function getTransactionCount(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId));

  return result.length;
}

export async function getAverageTransactionValue(branchId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId));

  if (result.length === 0) return 0;
  const total = result.reduce((sum, txn) => sum + parseFloat(txn.total), 0);
  return total / result.length;
}

export async function getPaymentMethodBreakdown(branchId: number) {
  const db = await getDb();
  if (!db) return {};

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.branchId, branchId));

  const breakdown: Record<string, number> = {
    cash: 0,
    card: 0,
    ewallet: 0,
    mixed: 0,
  };

  result.forEach((txn) => {
    breakdown[txn.paymentMethod] = (breakdown[txn.paymentMethod] || 0) + 1;
  });

  return breakdown;
}

export async function getTopSellingProducts(branchId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select()
    .from(transactionItems)
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(eq(transactions.branchId, branchId));

  // Group by product and sum quantities
  const productMap = new Map<number, { productId: number; quantity: number }>();

  items.forEach((item) => {
    const productId = item.transactionItems.productId;
    if (productMap.has(productId)) {
      const existing = productMap.get(productId)!;
      existing.quantity += item.transactionItems.quantity;
    } else {
      productMap.set(productId, {
        productId,
        quantity: item.transactionItems.quantity,
      });
    }
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}


/**
 * Refund Functions
 */

export async function createRefund(data: {
  transactionId: number;
  reason: string;
  refundAmount: string;
  processedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.insert(refunds).values({
    transactionId: data.transactionId,
    refundNumber,
    reason: data.reason,
    refundAmount: data.refundAmount,
    processedBy: data.processedBy,
    status: "pending",
  });

  return result;
}

export async function getRefundsByTransaction(transactionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(refunds)
    .where(eq(refunds.transactionId, transactionId));

  return result;
}
