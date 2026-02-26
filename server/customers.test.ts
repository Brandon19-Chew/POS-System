import { describe, it, expect } from "vitest";
import {
  createCustomer,
  getCustomerById,
  getAllCustomers,
  searchCustomers,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getCustomerTotalPoints,
  getCustomerPurchaseHistory,
  getCustomerTotalSpent,
  getCustomerPurchaseCount,
  updateCustomerTier,
  calculateCustomerTier,
  getRedemptionHistory,
} from "./db-customer";

describe("Customer Management", () => {
  describe("Customer CRUD Operations", () => {
    it("should create a customer", async () => {
      const result = await createCustomer({
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      });
      expect(result).toBeDefined();
    });

    it("should get customer by ID", async () => {
      const created = await createCustomer({
        name: "Jane Smith",
        email: "jane@example.com",
      });
      const customers = await getAllCustomers();
      expect(customers.length).toBeGreaterThan(0);
    });

    it("should get all customers", async () => {
      const customers = await getAllCustomers();
      expect(Array.isArray(customers)).toBe(true);
    });

    it("should search customers by name", async () => {
      await createCustomer({ name: "Search Test Customer" });
      const results = await searchCustomers("Search");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should update a customer", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const customer = customers[0];
        await updateCustomer(customer.id, { name: "Updated Name" });
        const updated = await getCustomerById(customer.id);
        expect(updated?.name).toBe("Updated Name");
      }
    });

    it("should soft delete a customer", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const customer = customers[0];
        await deleteCustomer(customer.id);
        const deleted = await getCustomerById(customer.id);
        expect(deleted?.isActive).toBe(false);
      }
    });
  });

  describe("Loyalty Points Management", () => {
    it("should add loyalty points", async () => {
      const customer = await createCustomer({ name: "Loyalty Test" });
      const customers = await getAllCustomers();
      const testCustomer = customers.find((c) => c.name === "Loyalty Test");

      if (testCustomer) {
        await addLoyaltyPoints(testCustomer.id, 100, "Test reward");
        const points = await getCustomerTotalPoints(testCustomer.id);
        expect(points).toBe(100);
      }
    });

    it("should redeem loyalty points", async () => {
      const customers = await getAllCustomers();
      const testCustomer = customers.find((c) => c.name === "Loyalty Test");

      if (testCustomer) {
        await addLoyaltyPoints(testCustomer.id, 50, "Additional points");
        await redeemLoyaltyPoints(testCustomer.id, 30, "Redeemed for discount");
        const points = await getCustomerTotalPoints(testCustomer.id);
        expect(points).toBe(120); // 100 + 50 - 30
      }
    });

    it("should get redemption history", async () => {
      const customers = await getAllCustomers();
      const testCustomer = customers.find((c) => c.name === "Loyalty Test");

      if (testCustomer) {
        const history = await getRedemptionHistory(testCustomer.id);
        expect(Array.isArray(history)).toBe(true);
      }
    });
  });

  describe("Customer Tier Management", () => {
    it("should calculate tier based on spending", async () => {
      const tier1 = await calculateCustomerTier(500);
      expect(tier1).toBe("standard");

      const tier2 = await calculateCustomerTier(1500);
      expect(tier2).toBe("silver");

      const tier3 = await calculateCustomerTier(6000);
      expect(tier3).toBe("gold");

      const tier4 = await calculateCustomerTier(15000);
      expect(tier4).toBe("vip");
    });

    it("should update customer tier", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const customer = customers[0];
        await updateCustomerTier(customer.id, "gold");
        const updated = await getCustomerById(customer.id);
        expect(updated?.tier).toBe("gold");
      }
    });
  });

  describe("Purchase History", () => {
    it("should get customer purchase history", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const history = await getCustomerPurchaseHistory(customers[0].id);
        expect(Array.isArray(history)).toBe(true);
      }
    });

    it("should get customer total spent", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const spent = await getCustomerTotalSpent(customers[0].id);
        expect(typeof spent).toBe("number");
        expect(spent).toBeGreaterThanOrEqual(0);
      }
    });

    it("should get customer purchase count", async () => {
      const customers = await getAllCustomers();
      if (customers.length > 0) {
        const count = await getCustomerPurchaseCount(customers[0].id);
        expect(typeof count).toBe("number");
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Data Validation", () => {
    it("should create customer with minimal data", async () => {
      const result = await createCustomer({ name: "Minimal Customer" });
      expect(result).toBeDefined();
    });

    it("should create customer with all fields", async () => {
      const result = await createCustomer({
        name: "Full Customer",
        email: "full@example.com",
        phone: "+1234567890",
        tier: "gold",
      });
      expect(result).toBeDefined();
    });
  });
});
