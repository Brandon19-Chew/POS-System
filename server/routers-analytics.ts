import { router, protectedProcedure } from "./_core/trpc";
import {
  generateSalesForecast,
  getCustomerSegmentation,
  getProductPerformance,
  generateAIInsights,
  detectAnomalies,
  getRevenueByPaymentMethod,
  predictCustomerLifetimeValue,
} from "./db-analytics";

export const analyticsRouter = router({
  // Sales Forecasting
  getSalesForecast: protectedProcedure
    .input((val: any) => {
      if (typeof val === "object" && val !== null && "days" in val) {
        return val as { days?: number };
      }
      return {};
    })
    .query(async ({ input }) => {
      return await generateSalesForecast(input.days || 30);
    }),

  // Customer Segmentation
  getCustomerSegmentation: protectedProcedure.query(async () => {
    return await getCustomerSegmentation();
  }),

  // Product Performance
  getProductPerformance: protectedProcedure.query(async () => {
    return await getProductPerformance();
  }),

  // AI Insights
  getAIInsights: protectedProcedure.query(async () => {
    return await generateAIInsights();
  }),

  // Anomaly Detection
  detectAnomalies: protectedProcedure.query(async () => {
    return await detectAnomalies();
  }),

  // Revenue by Payment Method
  getRevenueByPaymentMethod: protectedProcedure.query(async () => {
    return await getRevenueByPaymentMethod();
  }),

  // Customer Lifetime Value Prediction
  predictCustomerLifetimeValue: protectedProcedure.query(async () => {
    return await predictCustomerLifetimeValue();
  }),
});
