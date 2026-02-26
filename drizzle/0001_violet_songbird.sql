CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`changes` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branchStock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`lastStockCheck` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branchStock_id` PRIMARY KEY(`id`),
	CONSTRAINT `branch_product_idx` UNIQUE(`branchId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`address` text,
	`phone` varchar(20),
	`email` varchar(320),
	`timezone` varchar(50) NOT NULL DEFAULT 'UTC',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`taxRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_code_unique` UNIQUE(`code`),
	CONSTRAINT `branch_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`logoUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`tier` enum('standard','silver','gold','vip') NOT NULL DEFAULT 'standard',
	`loyaltyPoints` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalPurchases` int NOT NULL DEFAULT 0,
	`lastPurchaseDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`),
	CONSTRAINT `customer_email_idx` UNIQUE(`email`),
	CONSTRAINT `customer_phone_idx` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `heldTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`heldBy` int NOT NULL,
	`heldAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`notes` text,
	CONSTRAINT `heldTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `heldTransactions_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`transactionId` int,
	`type` enum('earn','redeem') NOT NULL,
	`points` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`branchId` int,
	`type` enum('low_stock','expiry_alert','promo_expiry','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int NOT NULL,
	`brandId` int,
	`uomId` int NOT NULL,
	`cost` decimal(12,2) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`attributes` json,
	`imageUrls` json,
	`minimumStockLevel` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`),
	CONSTRAINT `products_barcode_unique` UNIQUE(`barcode`),
	CONSTRAINT `sku_idx` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('percentage','fixed','buy_x_get_y','member_only','happy_hour') NOT NULL,
	`discountValue` decimal(12,2),
	`buyQuantity` int,
	`getQuantity` int,
	`getProductId` int,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`applicableProductIds` json,
	`applicableBranchIds` json,
	`memberOnly` boolean NOT NULL DEFAULT false,
	`priority` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitCost` decimal(12,2) NOT NULL,
	`receivedQuantity` int NOT NULL DEFAULT 0,
	`expiryDate` date,
	`batchNumber` varchar(100),
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poNumber` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`branchId` int NOT NULL,
	`status` enum('draft','pending','received','cancelled') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(12,2) NOT NULL,
	`receivedAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`outstandingAmount` decimal(12,2) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_poNumber_unique` UNIQUE(`poNumber`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`refundNumber` varchar(50) NOT NULL,
	`reason` text NOT NULL,
	`refundAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','approved','completed','rejected') NOT NULL DEFAULT 'pending',
	`processedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `refunds_refundNumber_unique` UNIQUE(`refundNumber`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`productId` int NOT NULL,
	`type` enum('in','out','transfer','damage','return') NOT NULL,
	`quantity` int NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`fromBranchId` int,
	`batchNumber` varchar(100),
	`expiryDate` date,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`paymentTerms` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `transactionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`discountAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`taxAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`subtotal` decimal(12,2) NOT NULL,
	`appliedPromotionIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionNumber` varchar(50) NOT NULL,
	`branchId` int NOT NULL,
	`customerId` int,
	`cashierId` int NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`discountAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`taxAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`total` decimal(12,2) NOT NULL,
	`paymentMethod` enum('cash','card','ewallet','mixed') NOT NULL,
	`amountPaid` decimal(12,2) NOT NULL,
	`changeAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status` enum('completed','held','cancelled','refunded') NOT NULL DEFAULT 'completed',
	`pointsEarned` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_transactionNumber_unique` UNIQUE(`transactionNumber`)
);
--> statement-breakpoint
CREATE TABLE `unitOfMeasures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unitOfMeasures_id` PRIMARY KEY(`id`),
	CONSTRAINT `unitOfMeasures_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','cashier','warehouse_staff','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `email_idx` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_date_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `loyalty_customer_idx` ON `loyaltyTransactions` (`customerId`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`categoryId`);--> statement-breakpoint
CREATE INDEX `promo_date_idx` ON `promotions` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `po_supplier_idx` ON `purchaseOrders` (`supplierId`);--> statement-breakpoint
CREATE INDEX `po_branch_idx` ON `purchaseOrders` (`branchId`);--> statement-breakpoint
CREATE INDEX `refund_transaction_idx` ON `refunds` (`transactionId`);--> statement-breakpoint
CREATE INDEX `movement_branch_idx` ON `stockMovements` (`branchId`);--> statement-breakpoint
CREATE INDEX `movement_product_idx` ON `stockMovements` (`productId`);--> statement-breakpoint
CREATE INDEX `item_transaction_idx` ON `transactionItems` (`transactionId`);--> statement-breakpoint
CREATE INDEX `trans_branch_idx` ON `transactions` (`branchId`);--> statement-breakpoint
CREATE INDEX `trans_customer_idx` ON `transactions` (`customerId`);--> statement-breakpoint
CREATE INDEX `trans_date_idx` ON `transactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);