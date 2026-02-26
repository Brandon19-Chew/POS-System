import { describe, it, expect } from "vitest";
import {
  getDailySalesReport,
  getMonthlySalesReport,
  getYearlySalesReport,
  getBestSellingProducts,
  getLowStockProducts,
  getCashierPerformance,
  getProfitMarginAnalysis,
  getPaymentMethodAnalysis,
  getTopCustomers,
  getInventoryTurnover,
} from "./db-reports";

describe("Reports & Analytics", () => {
  describe("Sales Reports", () => {
    it("should get daily sales report", async () => {
      const today = new Date();
      const report = await getDailySalesReport(today);
      expect(report).toBeDefined();
      expect(report?.date).toBeDefined();
      expect(report?.transactionCount).toBeGreaterThanOrEqual(0);
      expect(report?.totalSales).toBeGreaterThanOrEqual(0);
    });

    it("should get monthly sales report", async () => {
      const now = new Date();
      const report = await getMonthlySalesReport(now.getFullYear(), now.getMonth() + 1);
      expect(report).toBeDefined();
      expect(report?.year).toBe(now.getFullYear());
      expect(report?.month).toBe(now.getMonth() + 1);
      expect(report?.monthName).toBeDefined();
      expect(report?.dailyBreakdown).toBeInstanceOf(Array);
    });

    it("should get yearly sales report", async () => {
      const now = new Date();
      const report = await getYearlySalesReport(now.getFullYear());
      expect(report).toBeDefined();
      expect(report?.year).toBe(now.getFullYear());
      expect(report?.monthlyBreakdown).toBeInstanceOf(Array);
      expect(report?.monthlyBreakdown.length).toBe(12);
    });
  });

  describe("Product Analytics", () => {
    it("should get best selling products", async () => {
      const products = await getBestSellingProducts(10, 30);
      expect(Array.isArray(products)).toBe(true);
      if (products.length > 0) {
        expect(products[0].productId).toBeDefined();
        expect(products[0].quantity).toBeGreaterThan(0);
        expect(products[0].revenue).toBeGreaterThanOrEqual(0);
      }
    });

    it("should get low stock products", async () => {
      const products = await getLowStockProducts(20);
      expect(Array.isArray(products)).toBe(true);
      if (products.length > 0) {
        expect(products[0].productId).toBeDefined();
        expect(products[0].currentStock).toBeLessThanOrEqual(products[0].minimumStock);
      }
    });
  });

  describe("Performance Metrics", () => {
    it("should get cashier performance", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const performance = await getCashierPerformance(startDate, endDate);
      expect(Array.isArray(performance)).toBe(true);
      if (performance.length > 0) {
        expect(performance[0].cashierId).toBeDefined();
        expect(performance[0].transactionCount).toBeGreaterThanOrEqual(0);
        expect(performance[0].totalSales).toBeGreaterThanOrEqual(0);
      }
    });

    it("should get profit margin analysis", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const analysis = await getProfitMarginAnalysis(startDate, endDate);
      expect(analysis).toBeDefined();
      expect(analysis?.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(analysis?.totalCost).toBeGreaterThanOrEqual(0);
      expect(analysis?.profitMargin).toBeDefined();
    });

    it("should get payment method analysis", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const methods = await getPaymentMethodAnalysis(startDate, endDate);
      expect(Array.isArray(methods)).toBe(true);
      if (methods.length > 0) {
        expect(methods[0].method).toBeDefined();
        expect(methods[0].count).toBeGreaterThan(0);
        expect(methods[0].totalAmount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Customer Analytics", () => {
    it("should get top customers", async () => {
      const customers = await getTopCustomers(10, 30);
      expect(Array.isArray(customers)).toBe(true);
      if (customers.length > 0) {
        expect(customers[0].customerId).toBeDefined();
        expect(customers[0].transactionCount).toBeGreaterThan(0);
        expect(customers[0].totalSpent).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Inventory Analytics", () => {
    it("should get inventory turnover", async () => {
      const turnover = await getInventoryTurnover(30);
      expect(Array.isArray(turnover)).toBe(true);
      if (turnover.length > 0) {
        expect(turnover[0].productId).toBeDefined();
        expect(turnover[0].unitsSold).toBeGreaterThan(0);
        expect(turnover[0].revenue).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
