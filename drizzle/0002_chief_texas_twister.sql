CREATE TABLE `adminRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleType` enum('moderator','support','financial','admin','super_admin') NOT NULL,
	`permissions` json,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedByAdminId` int,
	`isActive` boolean DEFAULT true,
	`deactivatedAt` timestamp,
	CONSTRAINT `adminRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`changes` json,
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentModerations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('service_description','chat_message','profile_bio','rating_review','photo') NOT NULL,
	`contentId` int NOT NULL,
	`userId` int NOT NULL,
	`reportedBy` int,
	`reason` varchar(100) NOT NULL,
	`description` text,
	`status` enum('pending','approved','rejected','removed') NOT NULL DEFAULT 'pending',
	`reviewedByAdminId` int,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `contentModerations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`respondentId` int NOT NULL,
	`serviceId` int NOT NULL,
	`escrowTransactionId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('payment_issue','service_not_completed','quality_issue','safety_concern','communication','other') NOT NULL,
	`evidence` json,
	`status` enum('open','in_review','mediation','resolved','closed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`resolutionType` enum('refund','partial_refund','no_refund','service_completion','other'),
	`assignedAdminId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSuspensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reason` text NOT NULL,
	`severity` enum('warning','temporary','permanent') NOT NULL,
	`suspendedAt` timestamp NOT NULL DEFAULT (now()),
	`suspendedUntil` timestamp,
	`suspendedByAdminId` int NOT NULL,
	`resolvedAt` timestamp,
	`resolvedByAdminId` int,
	CONSTRAINT `userSuspensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminRoles` ADD CONSTRAINT `adminRoles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminRoles` ADD CONSTRAINT `adminRoles_assignedByAdminId_users_id_fk` FOREIGN KEY (`assignedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentModerations` ADD CONSTRAINT `contentModerations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentModerations` ADD CONSTRAINT `contentModerations_reportedBy_users_id_fk` FOREIGN KEY (`reportedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentModerations` ADD CONSTRAINT `contentModerations_reviewedByAdminId_users_id_fk` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_respondentId_users_id_fk` FOREIGN KEY (`respondentId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_escrowTransactionId_escrowTransactions_id_fk` FOREIGN KEY (`escrowTransactionId`) REFERENCES `escrowTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_assignedAdminId_users_id_fk` FOREIGN KEY (`assignedAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSuspensions` ADD CONSTRAINT `userSuspensions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSuspensions` ADD CONSTRAINT `userSuspensions_suspendedByAdminId_users_id_fk` FOREIGN KEY (`suspendedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSuspensions` ADD CONSTRAINT `userSuspensions_resolvedByAdminId_users_id_fk` FOREIGN KEY (`resolvedByAdminId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;