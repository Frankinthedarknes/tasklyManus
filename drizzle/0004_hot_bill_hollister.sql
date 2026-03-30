CREATE TABLE `trustBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('trusted','highly_trusted','verified_expert','community_leader','perfect_rating','responsive','professional') NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50) NOT NULL,
	`color` varchar(20) DEFAULT 'blue',
	`fiveStarCount` int DEFAULT 0,
	`totalReviews` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`isActive` boolean DEFAULT true,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trustBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trustBadges` ADD CONSTRAINT `trustBadges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;