CREATE TABLE `fraudAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int,
	`alertType` enum('multiple_failed_attempts','unusual_location','high_velocity','card_testing','chargeback_risk','velocity_limit_exceeded') NOT NULL,
	`description` text,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`action` enum('flagged','blocked','requires_verification','manual_review','no_action') NOT NULL DEFAULT 'flagged',
	`resolvedAt` timestamp,
	`resolvedByAdminId` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraudAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`invoiceDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`invoiceStatus` enum('draft','sent','paid','cancelled','refunded') NOT NULL DEFAULT 'draft',
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`paidAt` timestamp,
	`cancelledAt` timestamp,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`stripeEventId` varchar(255),
	`result` enum('success','failed','pending') NOT NULL,
	`errorCode` varchar(50),
	`errorMessage` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packageId` varchar(10) NOT NULL,
	`tasklyAmount` int NOT NULL,
	`priceUSD` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCustomerId` varchar(255),
	`status` enum('pending','processing','succeeded','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('card','stripe_wallet','paypal','bank_transfer') NOT NULL DEFAULT 'card',
	`cardLast4` varchar(4),
	`cardBrand` varchar(50),
	`riskLevel` enum('low','medium','high') DEFAULT 'low',
	`fraudCheckResult` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`completedAt` timestamp,
	`failedAt` timestamp,
	`refundedAt` timestamp,
	`failureReason` text,
	`adminNotes` text,
	CONSTRAINT `paymentTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentTransactions_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text NOT NULL,
	`stripeRefundId` varchar(255),
	`refundStatus` enum('pending','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`approvedByAdminId` int,
	`processedAt` timestamp,
	`adminNotes` text,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `refunds_stripeRefundId_unique` UNIQUE(`stripeRefundId`)
);
--> statement-breakpoint
ALTER TABLE `fraudAlerts` ADD CONSTRAINT `fraudAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudAlerts` ADD CONSTRAINT `fraudAlerts_transactionId_paymentTransactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `paymentTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudAlerts` ADD CONSTRAINT `fraudAlerts_resolvedByAdminId_users_id_fk` FOREIGN KEY (`resolvedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_transactionId_paymentTransactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `paymentTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentAttempts` ADD CONSTRAINT `paymentAttempts_transactionId_paymentTransactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `paymentTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentAttempts` ADD CONSTRAINT `paymentAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentTransactions` ADD CONSTRAINT `paymentTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_transactionId_paymentTransactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `paymentTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_approvedByAdminId_users_id_fk` FOREIGN KEY (`approvedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;