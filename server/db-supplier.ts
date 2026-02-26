import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { suppliers, purchaseOrders, purchaseOrderItems } from "../drizzle/schema";

/**
 * Supplier Management Functions
 */

export async function createSupplier(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  paymentTerms?: string;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(suppliers).values({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    country: data.country,
    contactPerson: data.contactPerson,
    paymentTerms: data.paymentTerms,
    isActive: data.isActive,
  });

  return result;
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSuppliers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getActiveSuppliers() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.isActive, true))
    .orderBy(desc(suppliers.createdAt));
}

export async function updateSupplier(
  id: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    contactPerson?: string;
    paymentTerms?: string;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
  if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db.update(suppliers).set(updateData).where(eq(suppliers.id, id));

  return { success: true };
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(suppliers).where(eq(suppliers.id, id));

  return { success: true };
}

export async function searchSuppliers(query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(suppliers)
    .where(
      or(
        eq(suppliers.name, query),
        eq(suppliers.email, query),
        eq(suppliers.phone, query)
      )
    )
    .limit(10);
}

/**
 * Purchase Order Functions
 */

export async function createPurchaseOrder(data: {
  supplierId: number;
  branchId: number;
  poNumber: string;
  totalAmount: number;
  status: "draft" | "pending" | "received" | "cancelled";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(purchaseOrders).values({
    supplierId: data.supplierId,
    branchId: data.branchId,
    poNumber: data.poNumber,
    totalAmount: data.totalAmount.toString(),
    status: data.status,
    outstandingAmount: data.totalAmount.toString(),
    createdBy: data.createdBy,
  });

  return result;
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPurchaseOrdersBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrdersByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.branchId, branchId))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrdersByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, status as any))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function updatePurchaseOrder(
  id: number,
  data: {
    status?: "draft" | "pending" | "received" | "cancelled";
    totalAmount?: number;
    receivedAmount?: number;
    outstandingAmount?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount.toString();
  if (data.receivedAmount !== undefined) updateData.receivedAmount = data.receivedAmount.toString();
  if (data.outstandingAmount !== undefined) updateData.outstandingAmount = data.outstandingAmount.toString();

  await db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, id));

  return { success: true };
}

export async function getPendingPurchaseOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, "pending"))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getOverdueOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(
      or(
        eq(purchaseOrders.status, "pending"),
        eq(purchaseOrders.status, "draft")
      )
    )
    .orderBy(desc(purchaseOrders.createdAt));
}

/**
 * Purchase Order Analytics
 */

export async function getSupplierPurchaseHistory(supplierId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId))
    .orderBy(desc(purchaseOrders.createdAt))
    .limit(limit);
}

export async function getTotalPurchasesFromSupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return 0;

  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId));

  return orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
}

export async function getSupplierOrderCount(supplierId: number) {
  const db = await getDb();
  if (!db) return 0;

  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId));

  return orders.length;
}

export async function getAverageOrderValue(supplierId: number) {
  const db = await getDb();
  if (!db) return 0;

  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId));

  if (orders.length === 0) return 0;

  const total = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
  return total / orders.length;
}

export async function getTopSuppliers(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const allSuppliers = await db.select().from(suppliers);

  const suppliersWithStats = await Promise.all(
    allSuppliers.map(async (supplier) => ({
      ...supplier,
      totalPurchases: await getTotalPurchasesFromSupplier(supplier.id),
      orderCount: await getSupplierOrderCount(supplier.id),
      averageOrderValue: await getAverageOrderValue(supplier.id),
    }))
  );

  return suppliersWithStats
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, limit);
}

export async function getOutstandingInvoices(supplierId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(purchaseOrders)
    .where(
      or(
        eq(purchaseOrders.status, "pending"),
        eq(purchaseOrders.status, "draft")
      )
    );

  if (supplierId) {
    query = db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          or(
            eq(purchaseOrders.status, "pending"),
            eq(purchaseOrders.status, "draft")
          ),
          eq(purchaseOrders.supplierId, supplierId)
        )
      );
  }

  return await query.orderBy(desc(purchaseOrders.createdAt));
}

export async function getRecentSuppliers(limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(suppliers)
    .orderBy(desc(suppliers.createdAt))
    .limit(limit);
}

export async function validateSupplier(id: number) {
  const supplier = await getSupplierById(id);

  if (!supplier) {
    return {
      valid: false,
      reason: "Supplier not found",
    };
  }

  if (!supplier.isActive) {
    return {
      valid: false,
      reason: "Supplier is inactive",
    };
  }

  if (!supplier.email && !supplier.phone) {
    return {
      valid: false,
      reason: "Supplier has no contact information",
    };
  }

  return {
    valid: true,
    reason: "Supplier is valid",
  };
}
