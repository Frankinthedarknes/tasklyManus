CREATE TABLE `serviceSelections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`type` enum('liked','saved','contacted') DEFAULT 'liked',
	`interactionCount` int DEFAULT 1,
	`lastInteractedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceSelections_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_service_unique` UNIQUE(`userId`,`serviceId`)
);
--> statement-breakpoint
CREATE TABLE `userMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('photo','video') NOT NULL,
	`url` text NOT NULL,
	`title` varchar(255),
	`description` text,
	`displayOrder` int DEFAULT 0,
	`isMain` boolean DEFAULT false,
	`isPublic` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`verified` boolean DEFAULT false,
	`yearsOfExperience` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `serviceSelections` ADD CONSTRAINT `serviceSelections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceSelections` ADD CONSTRAINT `serviceSelections_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userMedia` ADD CONSTRAINT `userMedia_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSkills` ADD CONSTRAINT `userSkills_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;