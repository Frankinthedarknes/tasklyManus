CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`pointsAwarded` int DEFAULT 0,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockedUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blockedUserId` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockedUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isQuickMessage` boolean DEFAULT false,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`flaggedForSecurity` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`relatedServiceId` int,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escrowTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`requesterId` int NOT NULL,
	`providerId` int NOT NULL,
	`amountInTasklys` int NOT NULL,
	`status` enum('pending','locked','in_progress','completed','refunded','disputed') DEFAULT 'pending',
	`autoCloseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `escrowTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freeTokenPromotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('onboarding','referral','bonus') DEFAULT 'onboarding',
	`amount` int DEFAULT 5,
	`expiresAt` timestamp NOT NULL,
	`used` boolean DEFAULT false,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `freeTokenPromotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`raterId` int NOT NULL,
	`ratedUserId` int NOT NULL,
	`score` int NOT NULL,
	`review` text,
	`categories` json,
	`badges` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`priceInTasklys` int NOT NULL,
	`latitude` float NOT NULL,
	`longitude` float NOT NULL,
	`address` text,
	`urgency` enum('now','today','flexible') DEFAULT 'flexible',
	`status` enum('published','in_progress','completed','cancelled') DEFAULT 'published',
	`type` enum('offer','request') NOT NULL,
	`createdById` int NOT NULL,
	`assignedToId` int,
	`photos` json,
	`videos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','earn','spend','refund','withdrawal') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`relatedServiceId` int,
	`status` enum('pending','completed','failed') DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int DEFAULT 0,
	`totalEarned` int DEFAULT 0,
	`totalSpent` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photoVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `latitude` float;--> statement-breakpoint
ALTER TABLE `users` ADD `longitude` float;--> statement-breakpoint
ALTER TABLE `users` ADD `locationUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `idDocumentVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `facialVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `totalPoints` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `streak` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `streakLastUpdated` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `servicesCompleted` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `servicesRequested` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `averageRating` decimal(3,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `totalRatings` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `preferences` json;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuspended` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blockedUsers` ADD CONSTRAINT `blockedUsers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blockedUsers` ADD CONSTRAINT `blockedUsers_blockedUserId_users_id_fk` FOREIGN KEY (`blockedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user1Id_users_id_fk` FOREIGN KEY (`user1Id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user2Id_users_id_fk` FOREIGN KEY (`user2Id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_relatedServiceId_services_id_fk` FOREIGN KEY (`relatedServiceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `escrowTransactions` ADD CONSTRAINT `escrowTransactions_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `escrowTransactions` ADD CONSTRAINT `escrowTransactions_requesterId_users_id_fk` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `escrowTransactions` ADD CONSTRAINT `escrowTransactions_providerId_users_id_fk` FOREIGN KEY (`providerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `freeTokenPromotions` ADD CONSTRAINT `freeTokenPromotions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_raterId_users_id_fk` FOREIGN KEY (`raterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_ratedUserId_users_id_fk` FOREIGN KEY (`ratedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedServices` ADD CONSTRAINT `savedServices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedServices` ADD CONSTRAINT `savedServices_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_assignedToId_users_id_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokenTransactions` ADD CONSTRAINT `tokenTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;