CREATE TABLE `adminVerificationCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`email` varchar(320) NOT NULL,
	`isUsed` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminVerificationCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminVerificationCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `verification_email_idx` ON `adminVerificationCodes` (`email`);--> statement-breakpoint
CREATE INDEX `verification_code_idx` ON `adminVerificationCodes` (`code`);