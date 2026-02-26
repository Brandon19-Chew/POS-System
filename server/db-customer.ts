import { eq, and, desc, like } from "drizzle-orm";
import { getDb } from "./db";
import {
  customers,
  transactions,
  loyaltyTransactions,
} from "../drizzle/schema";

/**
 * Customer Management Functions
 */

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  tier?: "standard" | "silver" | "gold" | "vip";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(customers).values({
    name: data.name,
    email: data.email,
    phone: data.phone,
    tier: data.tier || "standard",
    isActive: true,
  });

  return result;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.isActive, true)))
    .limit(1);

  return result[0];
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(and(eq(customers.email, email), eq(customers.isActive, true)))
    .limit(1);

  return result[0];
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(and(eq(customers.phone, phone), eq(customers.isActive, true)))
    .limit(1);

  return result[0];
}

export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.isActive, true))
    .orderBy(desc(customers.createdAt));

  return result;
}

export async function searchCustomers(query: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.isActive, true),
        like(customers.name, `%${query}%`)
      )
    )
    .limit(20);

  return result;
}

export async function updateCustomer(
  id: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    tier?: "standard" | "silver" | "gold" | "vip";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.tier !== undefined) updateData.tier = data.tier;

  await db.update(customers).set(updateData).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customers)
    .set({ isActive: false })
    .where(eq(customers.id, id));
}

/**
 * Loyalty Points Functions
 */

export async function addLoyaltyPoints(
  customerId: number,
  points: number,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Record loyalty transaction
  await db.insert(loyaltyTransactions).values({
    customerId,
    type: "earn",
    points,
    description,
  });
}

export async function redeemLoyaltyPoints(
  customerId: number,
  points: number,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Record loyalty transaction
  await db.insert(loyaltyTransactions).values({
    customerId,
    type: "redeem",
    points,
    description,
  });
}

export async function getCustomerTotalPoints(customerId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.customerId, customerId));

  return result.reduce((total, transaction) => {
    return transaction.type === "earn"
      ? total + transaction.points
      : total - transaction.points;
  }, 0);
}

/**
 * Purchase History Functions
 */

export async function recordPurchase(data: {
  customerId: number;
  transactionId: number;
  pointsEarned: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Add points to loyalty account
  await addLoyaltyPoints(
    data.customerId,
    data.pointsEarned,
    `Purchase reward for transaction ${data.transactionId}`
  );
}

export async function getCustomerPurchaseHistory(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, customerId))
    .orderBy(desc(transactions.createdAt));

  return result;
}

export async function getCustomerTotalSpent(customerId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, customerId));

  return result.reduce((sum, transaction) => sum + parseFloat(transaction.total), 0);
}

export async function getCustomerPurchaseCount(customerId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, customerId));

  return result.length;
}

/**
 * Customer Tier Management
 */

export async function updateCustomerTier(
  customerId: number,
  tier: "standard" | "silver" | "gold" | "vip"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customers)
    .set({ tier })
    .where(eq(customers.id, customerId));
}

export async function calculateCustomerTier(totalSpent: number) {
  if (totalSpent >= 10000) return "vip";
  if (totalSpent >= 5000) return "gold";
  if (totalSpent >= 1000) return "silver";
  return "standard";
}

export async function getRedemptionHistory(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(loyaltyTransactions)
    .where(
      and(
        eq(loyaltyTransactions.customerId, customerId),
        eq(loyaltyTransactions.type, "redeem")
      )
    )
    .orderBy(desc(loyaltyTransactions.createdAt));

  return result;
}
