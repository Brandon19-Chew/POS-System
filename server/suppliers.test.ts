import { describe, expect, it } from "vitest";
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
  getTotalPurchasesFromSupplier,
  getSupplierOrderCount,
  getAverageOrderValue,
  getTopSuppliers,
  getOutstandingInvoices,
  validateSupplier,
} from "./db-supplier";

describe("Supplier Management", () => {
  let supplierId: number;
  let poId: number;

  // Supplier CRUD Tests
  it("should create a supplier", async () => {
    const result = await createSupplier({
      name: "Test Supplier",
      email: "test@supplier.com",
      phone: "+1-555-0100",
      address: "123 Supply St",
      city: "New York",
      country: "USA",
      contactPerson: "John Doe",
      paymentTerms: "Net 30",
      isActive: true,
    });

    expect(result).toBeDefined();
    supplierId = (result as any).insertId;
  });

  it("should get supplier by ID", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 2",
        email: "test2@supplier.com",
        phone: "+1-555-0101",
        address: "456 Supply Ave",
        city: "Los Angeles",
        country: "USA",
        contactPerson: "Jane Smith",
        paymentTerms: "Net 45",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const supplier = await getSupplierById(supplierId);
    expect(supplier).toBeDefined();
    expect(supplier?.name).toBe("Test Supplier 2");
  });

  it("should get all suppliers", async () => {
    const suppliers = await getAllSuppliers();
    expect(Array.isArray(suppliers)).toBe(true);
    expect(suppliers.length).toBeGreaterThan(0);
  });

  it("should get active suppliers", async () => {
    const suppliers = await getActiveSuppliers();
    expect(Array.isArray(suppliers)).toBe(true);
    suppliers.forEach((supplier) => {
      expect(supplier.isActive).toBe(true);
    });
  });

  it("should update a supplier", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 3",
        email: "test3@supplier.com",
        phone: "+1-555-0102",
        address: "789 Supply Blvd",
        city: "Chicago",
        country: "USA",
        contactPerson: "Bob Johnson",
        paymentTerms: "Net 60",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const result = await updateSupplier(supplierId, {
      email: "updated@supplier.com",
      paymentTerms: "Net 30",
    });

    expect(result.success).toBe(true);

    const updated = await getSupplierById(supplierId);
    expect(updated?.email).toBe("updated@supplier.com");
    expect(updated?.paymentTerms).toBe("Net 30");
  });

  it("should search suppliers", async () => {
    const suppliers = await searchSuppliers("Test");
    expect(Array.isArray(suppliers)).toBe(true);
  });

  // Purchase Order Tests
  it("should create a purchase order", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 4",
        email: "test4@supplier.com",
        phone: "+1-555-0103",
        address: "321 Supply Dr",
        city: "Houston",
        country: "USA",
        contactPerson: "Alice Brown",
        paymentTerms: "Net 45",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const result = await createPurchaseOrder({
      supplierId,
      branchId: 1,
      poNumber: `PO-${Date.now()}`,
      totalAmount: 5000,
      status: "pending",
      createdBy: 1,
    });

    expect(result).toBeDefined();
    poId = (result as any).insertId;
  });

  it("should get purchase order by ID", async () => {
    if (!poId) {
      if (!supplierId) {
        const result = await createSupplier({
          name: "Test Supplier 5",
          email: "test5@supplier.com",
          phone: "+1-555-0104",
          address: "654 Supply Ln",
          city: "Phoenix",
          country: "USA",
          contactPerson: "Charlie Davis",
          paymentTerms: "Net 30",
          isActive: true,
        });
        supplierId = (result as any).insertId;
      }

      const result = await createPurchaseOrder({
        supplierId,
        branchId: 1,
        poNumber: `PO-${Date.now()}`,
        totalAmount: 7500,
        status: "draft",
        createdBy: 1,
      });
      poId = (result as any).insertId;
    }

    const po = await getPurchaseOrderById(poId);
    expect(po).toBeDefined();
    expect(po?.supplierId).toBe(supplierId);
  });

  it("should get purchase orders by supplier", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 6",
        email: "test6@supplier.com",
        phone: "+1-555-0105",
        address: "987 Supply Ct",
        city: "Philadelphia",
        country: "USA",
        contactPerson: "Diana Evans",
        paymentTerms: "Net 60",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const pos = await getPurchaseOrdersBySupplier(supplierId);
    expect(Array.isArray(pos)).toBe(true);
    pos.forEach((po) => {
      expect(po.supplierId).toBe(supplierId);
    });
  });

  it("should update a purchase order", async () => {
    if (!poId) {
      if (!supplierId) {
        const result = await createSupplier({
          name: "Test Supplier 7",
          email: "test7@supplier.com",
          phone: "+1-555-0106",
          address: "147 Supply Way",
          city: "San Antonio",
          country: "USA",
          contactPerson: "Eve Foster",
          paymentTerms: "Net 45",
          isActive: true,
        });
        supplierId = (result as any).insertId;
      }

      const result = await createPurchaseOrder({
        supplierId,
        branchId: 1,
        poNumber: `PO-${Date.now()}`,
        totalAmount: 10000,
        status: "pending",
        createdBy: 1,
      });
      poId = (result as any).insertId;
    }

    const result = await updatePurchaseOrder(poId, {
      status: "received",
      receivedAmount: 10000,
      outstandingAmount: 0,
    });

    expect(result.success).toBe(true);

    const updated = await getPurchaseOrderById(poId);
    expect(updated?.status).toBe("received");
  });

  // Analytics Tests
  it("should get total purchases from supplier", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 8",
        email: "test8@supplier.com",
        phone: "+1-555-0107",
        address: "258 Supply Rd",
        city: "San Diego",
        country: "USA",
        contactPerson: "Frank Garcia",
        paymentTerms: "Net 30",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const total = await getTotalPurchasesFromSupplier(supplierId);
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it("should get supplier order count", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 9",
        email: "test9@supplier.com",
        phone: "+1-555-0108",
        address: "369 Supply St",
        city: "Dallas",
        country: "USA",
        contactPerson: "Grace Harris",
        paymentTerms: "Net 45",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const count = await getSupplierOrderCount(supplierId);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should get average order value", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 10",
        email: "test10@supplier.com",
        phone: "+1-555-0109",
        address: "741 Supply Ave",
        city: "San Jose",
        country: "USA",
        contactPerson: "Henry Jackson",
        paymentTerms: "Net 60",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const avg = await getAverageOrderValue(supplierId);
    expect(typeof avg).toBe("number");
    expect(avg).toBeGreaterThanOrEqual(0);
  });

  it("should get top suppliers", async () => {
    const suppliers = await getTopSuppliers(5);
    expect(Array.isArray(suppliers)).toBe(true);
    expect(suppliers.length).toBeLessThanOrEqual(5);
  });

  it("should get outstanding invoices", async () => {
    const invoices = await getOutstandingInvoices();
    expect(Array.isArray(invoices)).toBe(true);
  });

  it("should validate supplier", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier 11",
        email: "test11@supplier.com",
        phone: "+1-555-0110",
        address: "852 Supply Blvd",
        city: "Austin",
        country: "USA",
        contactPerson: "Iris King",
        paymentTerms: "Net 30",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const validation = await validateSupplier(supplierId);
    expect(validation).toBeDefined();
    expect(validation.reason).toBeDefined();
  });

  it("should delete a supplier", async () => {
    if (!supplierId) {
      const result = await createSupplier({
        name: "Test Supplier Delete",
        email: "delete@supplier.com",
        phone: "+1-555-0111",
        address: "963 Supply Ct",
        city: "Jacksonville",
        country: "USA",
        contactPerson: "Jack Lee",
        paymentTerms: "Net 45",
        isActive: true,
      });
      supplierId = (result as any).insertId;
    }

    const result = await deleteSupplier(supplierId);
    expect(result.success).toBe(true);

    const deleted = await getSupplierById(supplierId);
    expect(deleted).toBeUndefined();
  });
});
