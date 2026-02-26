import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
  json,
  date,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    password: text("password"), // Hashed password for JWT auth
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["admin", "manager", "cashier", "warehouse_staff", "user"]).default("user").notNull(),
    branchId: int("branchId"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Branches table for multi-branch support
 */
export const branches = mysqlTable(
  "branches",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    address: text("address"),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("branch_code_idx").on(table.code),
  })
);

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Categories table for product organization
 */
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Brands table
 */
export const brands = mysqlTable(
  "brands",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    logoUrl: text("logoUrl"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

/**
 * Unit of Measure (UOM) table
 */
export const unitOfMeasures = mysqlTable(
  "unitOfMeasures",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;
export type InsertUnitOfMeasure = typeof unitOfMeasures.$inferInsert;

/**
 * Products table
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    barcode: varchar("barcode", { length: 100 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: int("categoryId").notNull(),
    brandId: int("brandId"),
    uomId: int("uomId").notNull(),
    cost: decimal("cost", { precision: 12, scale: 2 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    attributes: json("attributes"), // JSON for size, color, type, etc.
    imageUrls: json("imageUrls"), // Array of image URLs
    minimumStockLevel: int("minimumStockLevel").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    skuIdx: uniqueIndex("sku_idx").on(table.sku),
    barcodeIdx: index("barcode_idx").on(table.barcode),
    categoryIdx: index("category_idx").on(table.categoryId),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Branch-specific stock levels
 */
export const branchStock = mysqlTable(
  "branchStock",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").default(0).notNull(),
    reservedQuantity: int("reservedQuantity").default(0).notNull(),
    lastStockCheck: timestamp("lastStockCheck").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    branchProductIdx: uniqueIndex("branch_product_idx").on(table.branchId, table.productId),
  })
);

export type BranchStock = typeof branchStock.$inferSelect;
export type InsertBranchStock = typeof branchStock.$inferInsert;

/**
 * Stock movements (in/out/transfer/damage)
 */
export const stockMovements = mysqlTable(
  "stockMovements",
  {
    id: int("id").autoincrement().primaryKey(),
    branchId: int("branchId").notNull(),
    productId: int("productId").notNull(),
    type: mysqlEnum("type", ["in", "out", "transfer", "damage", "return"]).notNull(),
    quantity: int("quantity").notNull(),
    referenceType: varchar("referenceType", { length: 50 }), // "purchase_order", "sales_order", "transfer", etc.
    referenceId: int("referenceId"),
    fromBranchId: int("fromBranchId"), // For transfers
    batchNumber: varchar("batchNumber", { length: 100 }),
    expiryDate: date("expiryDate"),
    notes: text("notes"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    branchIdx: index("movement_branch_idx").on(table.branchId),
    productIdx: index("movement_product_idx").on(table.productId),
  })
);

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

/**
 * Customers table for loyalty and purchase tracking
 */
export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    tier: mysqlEnum("tier", ["standard", "silver", "gold", "vip"]).default("standard").notNull(),
    loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
    totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0.00").notNull(),
    totalPurchases: int("totalPurchases").default(0).notNull(),
    lastPurchaseDate: timestamp("lastPurchaseDate"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("customer_email_idx").on(table.email),
    phoneIdx: uniqueIndex("customer_phone_idx").on(table.phone),
  })
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Suppliers table
 */
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    contactPerson: varchar("contactPerson", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),
    paymentTerms: varchar("paymentTerms", { length: 100 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Promotions table
 */
export const promotions = mysqlTable(
  "promotions",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["percentage", "fixed", "buy_x_get_y", "member_only", "happy_hour"]).notNull(),
    discountValue: decimal("discountValue", { precision: 12, scale: 2 }),
    buyQuantity: int("buyQuantity"), // For buy X get Y
    getQuantity: int("getQuantity"), // For buy X get Y
    getProductId: int("getProductId"), // For buy X get Y
    startDate: datetime("startDate").notNull(),
    endDate: datetime("endDate").notNull(),
    startTime: varchar("startTime", { length: 5 }), // HH:MM format for happy hour
    endTime: varchar("endTime", { length: 5 }), // HH:MM format for happy hour
    applicableProductIds: json("applicableProductIds"), // Array of product IDs
    applicableBranchIds: json("applicableBranchIds"), // Array of branch IDs
    memberOnly: boolean("memberOnly").default(false).notNull(),
    priority: int("priority").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    dateIdx: index("promo_date_idx").on(table.startDate, table.endDate),
  })
);

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

/**
 * Transactions (POS sales)
 */
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionNumber: varchar("transactionNumber", { length: 50 }).notNull().unique(),
    branchId: int("branchId").notNull(),
    customerId: int("customerId"),
    cashierId: int("cashierId").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "ewallet", "mixed"]).notNull(),
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).notNull(),
    changeAmount: decimal("changeAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    status: mysqlEnum("status", ["completed", "held", "cancelled", "refunded"]).default("completed").notNull(),
    pointsEarned: int("pointsEarned").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    branchIdx: index("trans_branch_idx").on(table.branchId),
    customerIdx: index("trans_customer_idx").on(table.customerId),
    dateIdx: index("trans_date_idx").on(table.createdAt),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Transaction items (line items in a transaction)
 */
export const transactionItems = mysqlTable(
  "transactionItems",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    appliedPromotionIds: json("appliedPromotionIds"), // Array of promotion IDs
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transactionIdx: index("item_transaction_idx").on(table.transactionId),
  })
);

export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = typeof transactionItems.$inferInsert;

/**
 * Held transactions for resume functionality
 */
export const heldTransactions = mysqlTable(
  "heldTransactions",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull().unique(),
    heldBy: int("heldBy").notNull(),
    heldAt: timestamp("heldAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    notes: text("notes"),
  }
);

export type HeldTransaction = typeof heldTransactions.$inferSelect;
export type InsertHeldTransaction = typeof heldTransactions.$inferInsert;

/**
 * Refunds and returns
 */
export const refunds = mysqlTable(
  "refunds",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull(),
    refundNumber: varchar("refundNumber", { length: 50 }).notNull().unique(),
    reason: text("reason").notNull(),
    refundAmount: decimal("refundAmount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "completed", "rejected"]).default("pending").notNull(),
    processedBy: int("processedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    transactionIdx: index("refund_transaction_idx").on(table.transactionId),
  })
);

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

/**
 * Purchase orders (for stock in)
 */
export const purchaseOrders = mysqlTable(
  "purchaseOrders",
  {
    id: int("id").autoincrement().primaryKey(),
    poNumber: varchar("poNumber", { length: 50 }).notNull().unique(),
    supplierId: int("supplierId").notNull(),
    branchId: int("branchId").notNull(),
    status: mysqlEnum("status", ["draft", "pending", "received", "cancelled"]).default("draft").notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    receivedAmount: decimal("receivedAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    outstandingAmount: decimal("outstandingAmount", { precision: 12, scale: 2 }).notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    supplierIdx: index("po_supplier_idx").on(table.supplierId),
    branchIdx: index("po_branch_idx").on(table.branchId),
  })
);

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase order items
 */
export const purchaseOrderItems = mysqlTable(
  "purchaseOrderItems",
  {
    id: int("id").autoincrement().primaryKey(),
    poId: int("poId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    unitCost: decimal("unitCost", { precision: 12, scale: 2 }).notNull(),
    receivedQuantity: int("receivedQuantity").default(0).notNull(),
    expiryDate: date("expiryDate"),
    batchNumber: varchar("batchNumber", { length: 100 }),
  }
);

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * Audit log for tracking user actions
 */
export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entityType", { length: 100 }).notNull(),
    entityId: int("entityId"),
    changes: json("changes"), // Before/after values
    ipAddress: varchar("ipAddress", { length: 45 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("audit_user_idx").on(table.userId),
    dateIdx: index("audit_date_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * System settings
 */
export const systemSettings = mysqlTable(
  "systemSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Loyalty points transactions
 */
export const loyaltyTransactions = mysqlTable(
  "loyaltyTransactions",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull(),
    transactionId: int("transactionId"),
    type: mysqlEnum("type", ["earn", "redeem"]).notNull(),
    points: int("points").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index("loyalty_customer_idx").on(table.customerId),
  })
);

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    branchId: int("branchId"),
    type: mysqlEnum("type", ["low_stock", "expiry_alert", "promo_expiry", "system"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notif_user_idx").on(table.userId),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Admin Verification Codes for registration
 */
export const adminVerificationCodes = mysqlTable(
  "adminVerificationCodes",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 6 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    isUsed: boolean("isUsed").default(false).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("verification_email_idx").on(table.email),
    codeIdx: index("verification_code_idx").on(table.code),
  })
);

export type AdminVerificationCode = typeof adminVerificationCodes.$inferSelect;
export type InsertAdminVerificationCode = typeof adminVerificationCodes.$inferInsert;
