import { eq, gte, lte, and, desc, sum } from "drizzle-orm";
import { getDb } from "./db";
import { transactions, transactionItems, products, branchStock, users } from "../drizzle/schema";

/**
 * Sales Report Functions
 */

export async function getDailySalesReport(date: Date) {
  const db = await getDb();
  if (!db) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dailyTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startOfDay), lte(transactions.createdAt, endOfDay)));

  const totalSales = dailyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.total || "0"),
    0
  );
  const totalTax = dailyTransactions.reduce((sum, t) => sum + parseFloat(t.taxAmount || "0"), 0);
  const totalDiscount = dailyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.discountAmount || "0"),
    0
  );

  return {
    date: date.toISOString().split("T")[0],
    transactionCount: dailyTransactions.length,
    totalSales,
    totalTax,
    totalDiscount,
    netSales: totalSales - totalDiscount,
    averageTransaction: dailyTransactions.length > 0 ? totalSales / dailyTransactions.length : 0,
    transactions: dailyTransactions,
  };
}

export async function getMonthlySalesReport(year: number, month: number) {
  const db = await getDb();
  if (!db) return null;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const monthlyTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startOfMonth), lte(transactions.createdAt, endOfMonth)));

  const totalSales = monthlyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.total || "0"),
    0
  );
  const totalTax = monthlyTransactions.reduce((sum, t) => sum + parseFloat(t.taxAmount || "0"), 0);
  const totalDiscount = monthlyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.discountAmount || "0"),
    0
  );

  // Group by day
  const dailyBreakdown: Record<string, any> = {};
  for (const transaction of monthlyTransactions) {
    const day = transaction.createdAt.toISOString().split("T")[0];
    if (!dailyBreakdown[day]) {
      dailyBreakdown[day] = {
        date: day,
        transactionCount: 0,
        totalSales: 0,
        totalTax: 0,
        totalDiscount: 0,
      };
    }
    dailyBreakdown[day].transactionCount++;
    dailyBreakdown[day].totalSales += parseFloat(transaction.total || "0");
    dailyBreakdown[day].totalTax += parseFloat(transaction.taxAmount || "0");
    dailyBreakdown[day].totalDiscount += parseFloat(transaction.discountAmount || "0");
  }

  return {
    year,
    month,
    monthName: new Date(year, month - 1).toLocaleString("default", { month: "long" }),
    transactionCount: monthlyTransactions.length,
    totalSales,
    totalTax,
    totalDiscount,
    netSales: totalSales - totalDiscount,
    averageTransaction: monthlyTransactions.length > 0 ? totalSales / monthlyTransactions.length : 0,
    dailyBreakdown: Object.values(dailyBreakdown),
  };
}

export async function getYearlySalesReport(year: number) {
  const db = await getDb();
  if (!db) return null;

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const yearlyTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startOfYear), lte(transactions.createdAt, endOfYear)));

  const totalSales = yearlyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.total || "0"),
    0
  );
  const totalTax = yearlyTransactions.reduce((sum, t) => sum + parseFloat(t.taxAmount || "0"), 0);
  const totalDiscount = yearlyTransactions.reduce(
    (sum, t) => sum + parseFloat(t.discountAmount || "0"),
    0
  );

  // Group by month
  const monthlyBreakdown: Record<number, any> = {};
  for (let m = 1; m <= 12; m++) {
    monthlyBreakdown[m] = {
      month: m,
      monthName: new Date(year, m - 1).toLocaleString("default", { month: "short" }),
      transactionCount: 0,
      totalSales: 0,
      totalTax: 0,
      totalDiscount: 0,
    };
  }

  for (const transaction of yearlyTransactions) {
    const month = transaction.createdAt.getMonth() + 1;
    monthlyBreakdown[month].transactionCount++;
    monthlyBreakdown[month].totalSales += parseFloat(transaction.total || "0");
    monthlyBreakdown[month].totalTax += parseFloat(transaction.taxAmount || "0");
    monthlyBreakdown[month].totalDiscount += parseFloat(transaction.discountAmount || "0");
  }

  return {
    year,
    transactionCount: yearlyTransactions.length,
    totalSales,
    totalTax,
    totalDiscount,
    netSales: totalSales - totalDiscount,
    averageTransaction: yearlyTransactions.length > 0 ? totalSales / yearlyTransactions.length : 0,
    monthlyBreakdown: Object.values(monthlyBreakdown),
  };
}

/**
 * Product Analytics
 */

export async function getBestSellingProducts(limit: number = 10, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const items = await db
    .select()
    .from(transactionItems)
    .where(gte(transactionItems.createdAt, startDate));

  // Group by product and calculate totals
  const productStats: Record<number, any> = {};
  for (const item of items) {
    if (!productStats[item.productId]) {
      productStats[item.productId] = {
        productId: item.productId,
        quantity: 0,
        revenue: 0,
        count: 0,
      };
    }
    productStats[item.productId].quantity += item.quantity;
    productStats[item.productId].revenue += parseFloat(item.subtotal || "0");
    productStats[item.productId].count++;
  }

  // Sort by revenue and get top products
  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  // Get product details
  const result = [];
  for (const stat of topProducts) {
    const product = await db.select().from(products).where(eq(products.id, stat.productId)).limit(1);
    if (product.length > 0) {
      result.push({
        ...stat,
        productName: product[0].name,
        productSku: product[0].sku,
        averagePrice: stat.revenue / stat.quantity,  });
    }
  }

  return result;
}

export async function getLowStockProducts(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const allProducts = await db.select().from(products);

  const lowStockProducts = [];
  for (const product of allProducts) {
    const stock = await db
      .select()
      .from(branchStock)
      .where(eq(branchStock.productId, product.id));

    const totalStock = stock.reduce((sum, s) => sum + s.quantity, 0);
    const minimumStock = product.minimumStockLevel || 0;

    if (totalStock <= minimumStock) {
      lowStockProducts.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        currentStock: totalStock,
        minimumStock,
        status: totalStock === 0 ? "out-of-stock" : "low-stock",
        branches: stock.map((s) => ({
          branchId: s.branchId,
          quantity: s.quantity,
        })),
      });
    }
  }

  return lowStockProducts.sort((a, b) => a.currentStock - b.currentStock).slice(0, limit);
}

/**
 * Cashier Performance
 */

export async function getCashierPerformance(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const cashierTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)));

  // Group by cashier
  const cashierStats: Record<number, any> = {};
  for (const transaction of cashierTransactions) {
    if (!cashierStats[transaction.cashierId]) {
      cashierStats[transaction.cashierId] = {
        cashierId: transaction.cashierId,
        transactionCount: 0,
        totalSales: 0,
        totalDiscount: 0,
        totalTax: 0,
        totalRefunds: 0,
      };
    }
    cashierStats[transaction.cashierId].transactionCount++;
    cashierStats[transaction.cashierId].totalSales += parseFloat(transaction.total || "0");
    cashierStats[transaction.cashierId].totalDiscount += parseFloat(
      transaction.discountAmount || "0"
    );
    cashierStats[transaction.cashierId].totalTax += parseFloat(transaction.taxAmount || "0");
    if (transaction.status === "refunded") {
      cashierStats[transaction.cashierId].totalRefunds += parseFloat(transaction.total || "0");
    }
  }

  // Get cashier names
  const result = [];
  for (const stat of Object.values(cashierStats)) {
    const cashier = await db.select().from(users).where(eq(users.id, stat.cashierId)).limit(1);
    if (cashier.length > 0) {
      result.push({
        ...stat,
        cashierName: cashier[0].name,
        averageTransaction: stat.transactionCount > 0 ? stat.totalSales / stat.transactionCount : 0,
      });
    }
  }

  return result.sort((a) => a.totalSales).reverse();
}

/**
 * Profit & Margin Analysis
 */

export async function getProfitMarginAnalysis(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  const items = await db
    .select()
    .from(transactionItems)
    .where(and(gte(transactionItems.createdAt, startDate), lte(transactionItems.createdAt, endDate)));

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  for (const item of items) {
    const revenue = parseFloat(item.subtotal || "0");
    const unitPrice = parseFloat(item.unitPrice || "0");
    const cost = unitPrice * item.quantity * 0.6; // Assuming 40% margin
    const profit = revenue - cost;

    totalRevenue += revenue;
    totalCost += cost;
    totalProfit += profit;
  }

  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin: profitMargin.toFixed(2),
    costPercentage: costPercentage.toFixed(2),
    itemCount: items.length,
  };
}

/**
 * Payment Method Analysis
 */

export async function getPaymentMethodAnalysis(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const allTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)));

  const paymentStats: Record<string, any> = {};

  for (const transaction of allTransactions) {
    const method = transaction.paymentMethod || "unknown";
    if (!paymentStats[method]) {
      paymentStats[method] = {
        method,
        count: 0,
        totalAmount: 0,
        averageAmount: 0,
      };
    }
    paymentStats[method].count++;
    paymentStats[method].totalAmount += parseFloat(transaction.total || "0");
  }

  // Calculate averages
  for (const stat of Object.values(paymentStats)) {
    stat.averageAmount = stat.count > 0 ? stat.totalAmount / stat.count : 0;
  }

  return Object.values(paymentStats).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Customer Analytics
 */

export async function getTopCustomers(limit: number = 10, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allTransactions = await db
    .select()
    .from(transactions)
    .where(gte(transactions.createdAt, startDate));

  // Group by customer
  const customerStats: Record<number, any> = {};
  for (const transaction of allTransactions) {
    if (transaction.customerId) {
      if (!customerStats[transaction.customerId]) {
        customerStats[transaction.customerId] = {
          customerId: transaction.customerId,
          transactionCount: 0,
          totalSpent: 0,
        };
      }
      customerStats[transaction.customerId].transactionCount++;
      customerStats[transaction.customerId].totalSpent += parseFloat(transaction.total || "0");
    }
  }

  return Object.values(customerStats)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Inventory Turnover
 */

export async function getInventoryTurnover(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const items = await db
    .select()
    .from(transactionItems)
    .where(gte(transactionItems.createdAt, startDate));

  // Group by product
  const productTurnover: Record<number, any> = {};
  for (const item of items) {
    if (!productTurnover[item.productId]) {
      productTurnover[item.productId] = {
        productId: item.productId,
        unitsSold: 0,
        revenue: 0,
      };
    }
    productTurnover[item.productId].unitsSold += item.quantity;
    productTurnover[item.productId].revenue += parseFloat(item.subtotal || "0");
  }

  // Get product details
  const result = [];
  for (const turnover of Object.values(productTurnover)) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, turnover.productId))
      .limit(1);
    if (product.length > 0) {
      result.push({
        ...turnover,
        productName: product[0].name,
        productSku: product[0].sku,
      });
    }
  }

  return result.sort((a, b) => b.unitsSold - a.unitsSold);
}

/**
 * Stock Movement Report
 */

export async function getStockMovementReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // This would require a stock_movements table which should be queried
  // For now, returning empty array as placeholder
  return [];
}
