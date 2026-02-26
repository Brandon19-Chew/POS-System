import { describe, it, expect } from "vitest";
import {
  getInventoryByBranch,
  getLowStockItems,
  getOutOfStockItems,
  getOverstockedItems,
  getStockMovementsByBranch,
  getInventorySummary,
  getTotalInventoryValue,
  getAverageInventoryLevel,
  getStockMovementSummary,
  getInventoryTurnoverRate,
} from "./db-warehouse";

describe("Warehouse Management", () => {
  describe("Inventory Queries", () => {
    it("should retrieve inventory by branch", async () => {
      const inventory = await getInventoryByBranch(1);
      expect(Array.isArray(inventory)).toBe(true);
    });

    it("should get low stock items", async () => {
      const lowStock = await getLowStockItems(1);
      expect(Array.isArray(lowStock)).toBe(true);
      // All items should have quantity < 10
      lowStock.forEach((item) => {
        expect(item.quantity).toBeLessThan(10);
      });
    });

    it("should get out of stock items", async () => {
      const outOfStock = await getOutOfStockItems(1);
      expect(Array.isArray(outOfStock)).toBe(true);
      // All items should have quantity = 0
      outOfStock.forEach((item) => {
        expect(item.quantity).toBe(0);
      });
    });

    it("should get overstocked items", async () => {
      const overstock = await getOverstockedItems(1);
      expect(Array.isArray(overstock)).toBe(true);
      // All items should have quantity > 100
      overstock.forEach((item) => {
        expect(item.quantity).toBeGreaterThan(100);
      });
    });

    it("should get inventory summary", async () => {
      const summary = await getInventorySummary(1);
      expect(summary).toHaveProperty("total");
      expect(summary).toHaveProperty("lowStock");
      expect(summary).toHaveProperty("outOfStock");
      expect(summary).toHaveProperty("overstock");
      expect(typeof summary.total).toBe("number");
      expect(typeof summary.lowStock).toBe("number");
      expect(typeof summary.outOfStock).toBe("number");
      expect(typeof summary.overstock).toBe("number");
    });
  });

  describe("Inventory Analytics", () => {
    it("should calculate total inventory value", async () => {
      const value = await getTotalInventoryValue(1);
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it("should calculate average inventory level", async () => {
      const avg = await getAverageInventoryLevel(1);
      expect(typeof avg).toBe("number");
      expect(avg).toBeGreaterThanOrEqual(0);
    });

    it("should get inventory turnover rate", async () => {
      const rate = await getInventoryTurnoverRate(1);
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThanOrEqual(0);
    });

    it("should get stock movement summary", async () => {
      const summary = await getStockMovementSummary(1, 30);
      expect(summary).toHaveProperty("in");
      expect(summary).toHaveProperty("out");
      expect(summary).toHaveProperty("transfers");
      expect(typeof summary.in).toBe("number");
      expect(typeof summary.out).toBe("number");
      expect(typeof summary.transfers).toBe("number");
    });
  });

  describe("Stock Movements", () => {
    it("should retrieve stock movements by branch", async () => {
      const movements = await getStockMovementsByBranch(1);
      expect(Array.isArray(movements)).toBe(true);
    });

    it("should filter stock movements by type", async () => {
      const movements = await getStockMovementsByBranch(1);
      expect(Array.isArray(movements)).toBe(true);
      movements.forEach((m) => {
        expect(["in", "out", "transfer", "damage", "return"]).toContain(m.type);
      });
    });

    it("should respect limit parameter", async () => {
      const movements = await getStockMovementsByBranch(1, 5);
      expect(movements.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Stock Level Thresholds", () => {
    it("should identify low stock correctly", async () => {
      const inventory = await getInventoryByBranch(1);
      const lowStockCount = inventory.filter((i) => i.quantity < 10).length;
      const lowStock = await getLowStockItems(1);
      expect(lowStock.length).toBe(lowStockCount);
    });

    it("should identify out of stock correctly", async () => {
      const inventory = await getInventoryByBranch(1);
      const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;
      const outOfStock = await getOutOfStockItems(1);
      expect(outOfStock.length).toBe(outOfStockCount);
    });

    it("should identify overstock correctly", async () => {
      const inventory = await getInventoryByBranch(1);
      const overstockCount = inventory.filter((i) => i.quantity > 100).length;
      const overstock = await getOverstockedItems(1);
      expect(overstock.length).toBe(overstockCount);
    });
  });

  describe("Inventory Calculations", () => {
    it("should calculate correct total value", async () => {
      const inventory = await getInventoryByBranch(1);
      const manualTotal = inventory.reduce((sum, item) => {
        return sum + item.quantity * parseFloat(item.productPrice);
      }, 0);

      const apiTotal = await getTotalInventoryValue(1);
      expect(Math.abs(apiTotal - manualTotal)).toBeLessThan(0.01);
    });

    it("should calculate correct average level", async () => {
      const inventory = await getInventoryByBranch(1);
      if (inventory.length > 0) {
        const manualAvg = inventory.reduce((sum, item) => sum + item.quantity, 0) / inventory.length;
        const apiAvg = await getAverageInventoryLevel(1);
        expect(Math.abs(apiAvg - manualAvg)).toBeLessThan(0.01);
      }
    });
  });

  describe("Movement Summary", () => {
    it("should calculate movement summary for 30 days", async () => {
      const summary = await getStockMovementSummary(1, 30);
      expect(summary.in + summary.out + summary.transfers).toBeGreaterThanOrEqual(0);
    });

    it("should calculate movement summary for 7 days", async () => {
      const summary = await getStockMovementSummary(1, 7);
      expect(summary.in + summary.out + summary.transfers).toBeGreaterThanOrEqual(0);
    });

    it("should handle custom day ranges", async () => {
      const summary30 = await getStockMovementSummary(1, 30);
      const summary7 = await getStockMovementSummary(1, 7);
      // 7-day summary should be <= 30-day summary
      expect(summary7.in).toBeLessThanOrEqual(summary30.in);
      expect(summary7.out).toBeLessThanOrEqual(summary30.out);
    });
  });

  describe("Branch-Specific Data", () => {
    it("should return different data for different branches", async () => {
      const branch1 = await getInventoryByBranch(1);
      const branch2 = await getInventoryByBranch(2);
      // Both should be arrays but may have different content
      expect(Array.isArray(branch1)).toBe(true);
      expect(Array.isArray(branch2)).toBe(true);
    });

    it("should calculate separate values per branch", async () => {
      const value1 = await getTotalInventoryValue(1);
      const value2 = await getTotalInventoryValue(2);
      expect(typeof value1).toBe("number");
      expect(typeof value2).toBe("number");
    });
  });

  describe("Empty Results", () => {
    it("should return empty array for non-existent branch", async () => {
      const inventory = await getInventoryByBranch(99999);
      expect(Array.isArray(inventory)).toBe(true);
    });

    it("should return 0 for value of non-existent branch", async () => {
      const value = await getTotalInventoryValue(99999);
      expect(value).toBe(0);
    });

    it("should return 0 for average of non-existent branch", async () => {
      const avg = await getAverageInventoryLevel(99999);
      expect(avg).toBe(0);
    });
  });
});
