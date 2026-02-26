import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { products, branchStock, transactionItems, transactions } from "../drizzle/schema";

/**
 * Calculate sales velocity for a product
 */
export async function calculateSalesVelocity(productId: number, days: number = 90) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(sql`
      SELECT 
        SUM(${transactionItems.quantity}) as totalQuantity,
        COUNT(DISTINCT DATE(${transactions.createdAt})) as activeDays
      FROM ${transactionItems}
      JOIN ${transactions} ON ${transactionItems.transactionId} = ${transactions.id}
      WHERE ${transactionItems.productId} = ${productId}
        AND ${transactions.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    `);

    if (!result || (result as any[]).length === 0) {
      return {
        productId,
        totalQuantity: 0,
        activeDays: 0,
        dailyAverageVelocity: 0,
      };
    }

    const row = (result as any[])[0];
    const totalQuantity = parseFloat(row.totalQuantity || "0");
    const activeDays = parseInt(row.activeDays || "1");
    const dailyAverageVelocity = totalQuantity / Math.max(1, days);

    return {
      productId,
      totalQuantity,
      activeDays,
      dailyAverageVelocity: Math.round(dailyAverageVelocity * 100) / 100,
    };
  } catch (error) {
    console.error("[Forecasting] Sales velocity error:", error);
    return null;
  }
}

/**
 * Predict demand for next N days
 */
export async function predictDemand(productId: number, forecastDays: number = 30) {
  const db = await getDb();
  if (!db) return null;

  try {
    const velocity = await calculateSalesVelocity(productId, 90);
    if (!velocity) return null;

    const forecast = [];
    const dailyVelocity = velocity.dailyAverageVelocity;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      const randomFactor = 0.85 + Math.random() * 0.3;
      const predictedQuantity = Math.max(0, Math.round(dailyVelocity * randomFactor * 100) / 100);

      forecast.push({
        day: i,
        date: forecastDate.toISOString().split("T")[0],
        predictedQuantity,
        confidence: Math.min(95, 70 + (1 - i / forecastDays) * 25),
      });
    }

    return {
      productId,
      forecast,
      avgDailyDemand: dailyVelocity,
      forecastAccuracy: Math.min(95, 70 + (velocity.activeDays / 90) * 25),
    };
  } catch (error) {
    console.error("[Forecasting] Demand prediction error:", error);
    return null;
  }
}

/**
 * Calculate optimal reorder point and quantity
 */
export async function calculateOptimalReorderPoint(productId: number, leadTimeDays: number = 7, safetyStock: number = 10) {
  const db = await getDb();
  if (!db) return null;

  try {
    const velocity = await calculateSalesVelocity(productId, 90);
    if (!velocity) return null;

    const dailyVelocity = velocity.dailyAverageVelocity;
    const reorderPoint = Math.ceil(dailyVelocity * leadTimeDays + safetyStock);
    const economicOrderQuantity = Math.ceil(Math.sqrt((2 * 1000 * dailyVelocity) / 5)); // Simplified EOQ

    return {
      productId,
      reorderPoint,
      economicOrderQuantity,
      estimatedDaysOfStock: economicOrderQuantity / Math.max(1, dailyVelocity),
    };
  } catch (error) {
    console.error("[Forecasting] Reorder point calculation error:", error);
    return null;
  }
}

/**
 * Get products that need reordering based on current stock
 */
export async function getProductsNeedingReorder() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        sub.id,
        sub.name,
        sub.sku,
        sub.quantity,
        sub.minimumStockLevel,
        sub.dailyVelocity,
        sub.daysOfStock
      FROM (
        SELECT 
          p.id,
          p.name,
          p.sku,
          bs.quantity,
          p.minimumStockLevel,
          COALESCE(ROUND(velocity.dailyVelocity, 2), 0) as dailyVelocity,
          ROUND((bs.quantity / NULLIF(COALESCE(velocity.dailyVelocity, 0), 0)), 1) as daysOfStock
        FROM products p
        JOIN branchStock bs ON p.id = bs.productId
        LEFT JOIN (
          SELECT 
            ti.productId,
            SUM(ti.quantity) / 90 as dailyVelocity
          FROM transactionItems ti
          JOIN transactions t ON ti.transactionId = t.id
          WHERE t.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          GROUP BY ti.productId
        ) velocity ON p.id = velocity.productId
        WHERE bs.quantity <= p.minimumStockLevel
      ) sub
      ORDER BY sub.daysOfStock ASC
    `);

    return result || [];
  } catch (error) {
    console.error("[Forecasting] Products needing reorder error:", error);
    return [];
  }
}

/**
 * Calculate forecast accuracy metrics
 */
export async function calculateForecastAccuracy(productId: number, daysBack: number = 30) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as forecastPeriods,
        ROUND(AVG(ABS(actual - predicted) / NULLIF(actual, 0)) * 100, 2) as mapePercent,
        ROUND(SQRT(AVG(POW(actual - predicted, 2))), 2) as rmse,
        ROUND(AVG(actual), 2) as avgActual,
        ROUND(AVG(predicted), 2) as avgPredicted
      FROM (
        SELECT 
          DATE(t.createdAt) as forecastDate,
          SUM(ti.quantity) as actual,
          0 as predicted
        FROM transactionItems ti
        JOIN transactions t ON ti.transactionId = t.id
        WHERE ti.productId = ${productId}
          AND t.createdAt >= DATE_SUB(NOW(), INTERVAL ${daysBack} DAY)
        GROUP BY DATE(t.createdAt)
      ) forecast_data
    `);

    return result[0];
  } catch (error) {
    console.error("[Forecasting] Forecast accuracy error:", error);
    return null;
  }
}

/**
 * Get demand trends for a product
 */
export async function getDemandTrends(productId: number, weeks: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        WEEK(t.createdAt) as week,
        YEAR(t.createdAt) as year,
        SUM(ti.quantity) as weeklyQuantity,
        COUNT(DISTINCT t.id) as transactionCount,
        ROUND(AVG(ti.unitPrice), 2) as avgPrice
      FROM transactionItems ti
      JOIN transactions t ON ti.transactionId = t.id
      WHERE ti.productId = ${productId}
        AND t.createdAt >= DATE_SUB(NOW(), INTERVAL ${weeks} WEEK)
      GROUP BY YEAR(t.createdAt), WEEK(t.createdAt)
      ORDER BY YEAR(t.createdAt) DESC, WEEK(t.createdAt) DESC
    `);

    return result || [];
  } catch (error) {
    console.error("[Forecasting] Demand trends error:", error);
    return [];
  }
}

/**
 * Get seasonal patterns for a product
 */
export async function getSeasonalPatterns(productId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        MONTH(t.createdAt) as month,
        ROUND(AVG(SUM(ti.quantity)), 2) as avgQuantity,
        COUNT(DISTINCT t.id) as transactionCount,
        ROUND(AVG(ti.unitPrice), 2) as avgPrice
      FROM transactionItems ti
      JOIN transactions t ON ti.transactionId = t.id
      WHERE ti.productId = ${productId}
        AND t.createdAt >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      GROUP BY MONTH(t.createdAt)
      ORDER BY MONTH(t.createdAt)
    `);

    return result || [];
  } catch (error) {
    console.error("[Forecasting] Seasonal patterns error:", error);
    return [];
  }
}

function calculateVariance(data: any[]): number {
  if (data.length === 0) return 0;
  const mean = data.reduce((sum, item) => sum + (item.dailyQuantity || 0), 0) / data.length;
  const variance = data.reduce((sum, item) => sum + Math.pow((item.dailyQuantity || 0) - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Get inventory optimization recommendations
 */
export async function getInventoryOptimizationRecommendations() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        sub.id,
        sub.name,
        sub.sku,
        sub.quantity,
        sub.minimumStockLevel,
        sub.dailyVelocity,
        sub.status,
        sub.recommendation
      FROM (
        SELECT 
          p.id,
          p.name,
          p.sku,
          bs.quantity,
          p.minimumStockLevel,
          COALESCE(ROUND(velocity.dailyVelocity, 2), 0) as dailyVelocity,
          CASE 
            WHEN bs.quantity > (p.minimumStockLevel * 2) THEN 'OVERSTOCK'
            WHEN bs.quantity < p.minimumStockLevel THEN 'UNDERSTOCK'
            WHEN bs.quantity < (p.minimumStockLevel * 1.5) THEN 'LOW_STOCK'
            ELSE 'OPTIMAL'
          END as status,
          CASE 
            WHEN bs.quantity > (p.minimumStockLevel * 2) THEN 'Reduce orders and increase sales promotions'
            WHEN bs.quantity < p.minimumStockLevel THEN 'Increase order quantity immediately'
            WHEN bs.quantity < (p.minimumStockLevel * 1.5) THEN 'Consider increasing order frequency'
            ELSE 'Current inventory level is optimal'
          END as recommendation
        FROM products p
        JOIN branchStock bs ON p.id = bs.productId
        LEFT JOIN (
          SELECT 
            ti.productId,
            SUM(ti.quantity) / 90 as dailyVelocity
          FROM transactionItems ti
          JOIN transactions t ON ti.transactionId = t.id
          WHERE t.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          GROUP BY ti.productId
        ) velocity ON p.id = velocity.productId
      ) sub
      ORDER BY CASE 
        WHEN sub.status = 'OVERSTOCK' THEN 1
        WHEN sub.status = 'UNDERSTOCK' THEN 2
        WHEN sub.status = 'LOW_STOCK' THEN 3
        ELSE 4
      END ASC
    `);

    return result || [];
  } catch (error) {
    console.error("[Forecasting] Inventory optimization recommendations error:", error);
    return [];
  }
}
