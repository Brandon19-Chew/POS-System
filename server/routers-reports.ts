import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
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
import * as XLSX from "xlsx";
import { PDFDocument, rgb } from "pdf-lib";

export const reportsRouter = router({
  // Sales Reports
  getDailySalesReport: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(({ input }) => getDailySalesReport(input.date)),

  getMonthlySalesReport: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(({ input }) => getMonthlySalesReport(input.year, input.month)),

  getYearlySalesReport: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(({ input }) => getYearlySalesReport(input.year)),

  // Product Analytics
  getBestSellingProducts: protectedProcedure
    .input(z.object({ limit: z.number().optional(), days: z.number().optional() }))
    .query(({ input }) => getBestSellingProducts(input.limit, input.days)),

  getLowStockProducts: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getLowStockProducts(input.limit)),

  // Cashier Performance
  getCashierPerformance: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(({ input }) => getCashierPerformance(input.startDate, input.endDate)),

  // Profit & Margin
  getProfitMarginAnalysis: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(({ input }) => getProfitMarginAnalysis(input.startDate, input.endDate)),

  // Payment Methods
  getPaymentMethodAnalysis: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(({ input }) => getPaymentMethodAnalysis(input.startDate, input.endDate)),

  // Customer Analytics
  getTopCustomers: protectedProcedure
    .input(z.object({ limit: z.number().optional(), days: z.number().optional() }))
    .query(({ input }) => getTopCustomers(input.limit, input.days)),

  // Inventory Turnover
  getInventoryTurnover: protectedProcedure
    .input(z.object({ days: z.number().optional() }))
    .query(({ input }) => getInventoryTurnover(input.days)),

  // Export Functions
  exportSalesReportToExcel: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .mutation(async ({ input }) => {
      const report = await getMonthlySalesReport(input.year, input.month);

      if (!report) {
        throw new Error("Report not found");
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Sales Report", `${report.monthName} ${report.year}`],
        [],
        ["Metric", "Value"],
        ["Total Transactions", report.transactionCount],
        ["Total Sales", `$${report.totalSales.toFixed(2)}`],
        ["Total Tax", `$${report.totalTax.toFixed(2)}`],
        ["Total Discount", `$${report.totalDiscount.toFixed(2)}`],
        ["Net Sales", `$${report.netSales.toFixed(2)}`],
        ["Average Transaction", `$${report.averageTransaction.toFixed(2)}`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Daily breakdown sheet
      const dailyData = [
        ["Date", "Transactions", "Sales", "Tax", "Discount", "Net Sales"],
        ...report.dailyBreakdown.map((day: any) => [
          day.date,
          day.transactionCount,
          `$${day.totalSales.toFixed(2)}`,
          `$${day.totalTax.toFixed(2)}`,
          `$${day.totalDiscount.toFixed(2)}`,
          `$${(day.totalSales - day.totalDiscount).toFixed(2)}`,
        ]),
      ];

      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailySheet, "Daily Breakdown");

      // Generate file
      const fileName = `sales-report-${report.year}-${report.month}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, fileName };
    }),

  exportBestSellingProductsToExcel: protectedProcedure
    .input(z.object({ limit: z.number().optional(), days: z.number().optional() }))
    .mutation(async ({ input }) => {
      const products = await getBestSellingProducts(input.limit, input.days);

      const wb = XLSX.utils.book_new();

      const data = [
        ["Product", "SKU", "Quantity Sold", "Revenue", "Average Price"],
        ...products.map((p: any) => [
          p.productName,
          p.productSku,
          p.quantity,
          `$${p.revenue.toFixed(2)}`,
          `$${p.averagePrice.toFixed(2)}`,
        ]),
      ];

      const sheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, sheet, "Best Sellers");

      const fileName = `best-selling-products-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, fileName };
    }),

  exportLowStockProductsToExcel: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .mutation(async ({ input }) => {
      const products = await getLowStockProducts(input.limit);

      const wb = XLSX.utils.book_new();

      const data = [
        ["Product", "SKU", "Current Stock", "Minimum Stock", "Status"],
        ...products.map((p: any) => [
          p.productName,
          p.productSku,
          p.currentStock,
          p.minimumStock,
          p.status,
        ]),
      ];

      const sheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, sheet, "Low Stock");

      const fileName = `low-stock-products-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, fileName };
    }),

  exportCashierPerformanceToExcel: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .mutation(async ({ input }) => {
      const performance = await getCashierPerformance(input.startDate, input.endDate);

      const wb = XLSX.utils.book_new();

      const data = [
        ["Cashier", "Transactions", "Total Sales", "Discount", "Tax", "Refunds", "Average Sale"],
        ...performance.map((p: any) => [
          p.cashierName,
          p.transactionCount,
          `$${p.totalSales.toFixed(2)}`,
          `$${p.totalDiscount.toFixed(2)}`,
          `$${p.totalTax.toFixed(2)}`,
          `$${p.totalRefunds.toFixed(2)}`,
          `$${p.averageTransaction.toFixed(2)}`,
        ]),
      ];

      const sheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, sheet, "Cashier Performance");

      const fileName = `cashier-performance-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, fileName };
    }),

  exportProfitMarginAnalysisToExcel: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .mutation(async ({ input }) => {
      const analysis = await getProfitMarginAnalysis(input.startDate, input.endDate);

      if (!analysis) {
        throw new Error("Analysis not found");
      }

      const wb = XLSX.utils.book_new();

      const data = [
        ["Profit & Margin Analysis"],
        [],
        ["Metric", "Value"],
        ["Total Revenue", `$${analysis.totalRevenue.toFixed(2)}`],
        ["Total Cost", `$${analysis.totalCost.toFixed(2)}`],
        ["Total Profit", `$${analysis.totalProfit.toFixed(2)}`],
        ["Profit Margin", `${analysis.profitMargin}%`],
        ["Cost Percentage", `${analysis.costPercentage}%`],
        ["Item Count", analysis.itemCount],
      ];

      const sheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, sheet, "Profit Analysis");

      const fileName = `profit-margin-analysis-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, fileName };
    }),

  // PDF Export (simplified version)
  exportSalesReportToPDF: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .mutation(async ({ input }) => {
      const report = await getMonthlySalesReport(input.year, input.month);

      if (!report) {
        throw new Error("Report not found");
      }

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const { height } = page.getSize();
      let yPosition = height - 50;

      // Title
      page.drawText(`Sales Report - ${report.monthName} ${report.year}`, {
        x: 50,
        y: yPosition,
        size: 24,
        color: rgb(0, 0, 0),
      });

      yPosition -= 40;

      // Summary
      page.drawText("Summary", { x: 50, y: yPosition, size: 16, color: rgb(0, 0, 0) });
      yPosition -= 25;

      const summaryLines = [
        `Total Transactions: ${report.transactionCount}`,
        `Total Sales: $${report.totalSales.toFixed(2)}`,
        `Total Tax: $${report.totalTax.toFixed(2)}`,
        `Total Discount: $${report.totalDiscount.toFixed(2)}`,
        `Net Sales: $${report.netSales.toFixed(2)}`,
        `Average Transaction: $${report.averageTransaction.toFixed(2)}`,
      ];

      for (const line of summaryLines) {
        page.drawText(line, { x: 50, y: yPosition, size: 12, color: rgb(0, 0, 0) });
        yPosition -= 20;
      }

      const pdfBytes = await pdfDoc.save();

      const fileName = `sales-report-${report.year}-${report.month}.pdf`;
      // In a real application, you would save this to a file or return as buffer
      return { success: true, fileName, size: pdfBytes.length };
    }),
});
