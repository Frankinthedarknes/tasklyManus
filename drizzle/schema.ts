import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  float,
} from "drizzle-orm/mysql-core";

/**
 * Core user table with Taskly-specific fields
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Profile fields
  photoUrl: text("photoUrl"),
  photoVerified: boolean("photoVerified").default(false),
  bio: text("bio"),
  
  // Location
  latitude: float("latitude"),
  longitude: float("longitude"),
  locationUpdatedAt: timestamp("locationUpdatedAt"),
  
  // Verification
  phoneVerified: boolean("phoneVerified").default(false),
  emailVerified: boolean("emailVerified").default(false),
  idDocumentVerified: boolean("idDocumentVerified").default(false),
  facialVerified: boolean("facialVerified").default(false),
  
  // Gamification
  level: int("level").default(1), // 1-5: Nuevo, Activo, Confiable, Pro, Leyenda
  totalPoints: int("totalPoints").default(0),
  streak: int("streak").default(0),
  streakLastUpdated: timestamp("streakLastUpdated"),
  
  // Statistics
  servicesCompleted: int("servicesCompleted").default(0),
  servicesRequested: int("servicesRequested").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  totalRatings: int("totalRatings").default(0),
  
  // Preferences
  preferences: json("preferences"), // { serviceCategories: [], maxDistance: 5 }
  
  // Account status
  isActive: boolean("isActive").default(true),
  isSuspended: boolean("isSuspended").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Wallet: tracks Taskly token balance for each user
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  balance: int("balance").default(0), // Tasklys balance
  totalEarned: int("totalEarned").default(0),
  totalSpent: int("totalSpent").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Token transactions: history of Taskly purchases, earnings, and transfers
 */
export const tokenTransactions = mysqlTable("tokenTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["purchase", "earn", "spend", "refund", "withdrawal"]).notNull(),
  amount: int("amount").notNull(),
  description: text("description"),
  relatedServiceId: int("relatedServiceId"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("completed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

/**
 * Services: core marketplace entity
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  
  // Service metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  
  // Pricing
  priceInTasklys: int("priceInTasklys").notNull(),
  
  // Location
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),
  address: text("address"),
  
  // Urgency
  urgency: mysqlEnum("urgency", ["now", "today", "flexible"]).default("flexible"),
  
  // Status
  status: mysqlEnum("status", ["published", "in_progress", "completed", "cancelled"]).default("published"),
  
  // Type: offer (prestador offers) or request (solicitante requests)
  type: mysqlEnum("type", ["offer", "request"]).notNull(),
  
  // Creator
  createdById: int("createdById").notNull().references(() => users.id),
  
  // Assignment
  assignedToId: int("assignedToId").references(() => users.id),
  
  // Media
  photos: json("photos"), // Array of photo URLs
  videos: json("videos"), // Array of video URLs (max 2)
  
  // Dates
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Escrow: manages payment security during service transactions
 */
export const escrowTransactions = mysqlTable("escrowTransactions", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull().references(() => services.id),
  requesterId: int("requesterId").notNull().references(() => users.id),
  providerId: int("providerId").notNull().references(() => users.id),
  
  amountInTasklys: int("amountInTasklys").notNull(),
  
  status: mysqlEnum("status", [
    "pending",
    "locked",
    "in_progress",
    "completed",
    "refunded",
    "disputed",
  ]).default("pending"),
  
  // Auto-close settings
  autoCloseAt: timestamp("autoCloseAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type InsertEscrowTransaction = typeof escrowTransactions.$inferInsert;

/**
 * Chat messages: internal messaging with security
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  
  // Conversation
  conversationId: int("conversationId").notNull().references(() => conversations.id),
  
  // Sender
  senderId: int("senderId").notNull().references(() => users.id),
  
  // Content
  content: text("content").notNull(),
  
  // Quick message flag
  isQuickMessage: boolean("isQuickMessage").default(false),
  
  // Read status
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  
  // Flagged for security (contains external contact info)
  flaggedForSecurity: boolean("flaggedForSecurity").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Conversations: tracks chat threads between users
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  user1Id: int("user1Id").notNull().references(() => users.id),
  user2Id: int("user2Id").notNull().references(() => users.id),
  
  // Related service
  relatedServiceId: int("relatedServiceId").references(() => services.id),
  
  // Last message
  lastMessageAt: timestamp("lastMessageAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Ratings and reviews: bidirectional rating system
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Service reference
  serviceId: int("serviceId").notNull().references(() => services.id),
  
  // Rater and ratee
  raterId: int("raterId").notNull().references(() => users.id),
  ratedUserId: int("ratedUserId").notNull().references(() => users.id),
  
  // Rating
  score: int("score").notNull(), // 1-5
  review: text("review"),
  
  // Category-specific feedback
  categories: json("categories"), // { communication: 5, punctuality: 4, quality: 5 }
  
  // Badges
  badges: json("badges"), // ["responsive", "professional", "trustworthy"]
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Gamification achievements
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Achievement type
  type: varchar("type", { length: 100 }).notNull(), // "10_services", "perfect_rating", "streak_7"
  
  // Points awarded
  pointsAwarded: int("pointsAwarded").default(0),
  
  // Display
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * Free token promotions (onboarding, referrals, etc.)
 */
export const freeTokenPromotions = mysqlTable("freeTokenPromotions", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Promotion details
  type: mysqlEnum("type", ["onboarding", "referral", "bonus"]).default("onboarding"),
  amount: int("amount").default(5), // Tasklys
  
  // Expiration
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("usedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FreeTokenPromotion = typeof freeTokenPromotions.$inferSelect;
export type InsertFreeTokenPromotion = typeof freeTokenPromotions.$inferInsert;

/**
 * Saved services (favorites/bookmarks)
 */
export const savedServices = mysqlTable("savedServices", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  serviceId: int("serviceId").notNull().references(() => services.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedService = typeof savedServices.$inferSelect;
export type InsertSavedService = typeof savedServices.$inferInsert;

/**
 * Blocked users
 */
export const blockedUsers = mysqlTable("blockedUsers", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  blockedUserId: int("blockedUserId").notNull().references(() => users.id),
  
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = typeof blockedUsers.$inferInsert;

/**
 * Disputes - User-reported issues and conflicts
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Involved parties
  reporterId: int("reporterId").notNull().references(() => users.id),
  respondentId: int("respondentId").notNull().references(() => users.id),
  serviceId: int("serviceId").notNull().references(() => services.id),
  escrowTransactionId: int("escrowTransactionId").references(() => escrowTransactions.id),
  
  // Dispute details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "payment_issue",
    "service_not_completed",
    "quality_issue",
    "safety_concern",
    "communication",
    "other"
  ]).notNull(),
  
  // Evidence
  evidence: json("evidence"), // Array of file URLs/descriptions
  
  // Status
  status: mysqlEnum("status", [
    "open",
    "in_review",
    "mediation",
    "resolved",
    "closed"
  ]).default("open").notNull(),
  
  // Resolution
  resolution: text("resolution"),
  resolutionType: mysqlEnum("resolutionType", [
    "refund",
    "partial_refund",
    "no_refund",
    "service_completion",
    "other"
  ]),
  
  // Admin assignment
  assignedAdminId: int("assignedAdminId").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

/**
 * Audit logs - Track admin actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Admin who performed action
  adminId: int("adminId").notNull().references(() => users.id),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // "suspend_user", "resolve_dispute", "verify_payment"
  entityType: varchar("entityType", { length: 50 }).notNull(), // "user", "dispute", "transaction"
  entityId: int("entityId").notNull(),
  
  // Changes
  changes: json("changes"), // { before: {...}, after: {...} }
  reason: text("reason"),
  
  // IP and metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * User suspensions - Track account restrictions
 */
export const userSuspensions = mysqlTable("userSuspensions", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Suspension details
  reason: text("reason").notNull(),
  severity: mysqlEnum("severity", ["warning", "temporary", "permanent"]).notNull(),
  
  // Duration
  suspendedAt: timestamp("suspendedAt").defaultNow().notNull(),
  suspendedUntil: timestamp("suspendedUntil"),
  
  // Admin info
  suspendedByAdminId: int("suspendedByAdminId").notNull().references(() => users.id),
  
  // Resolution
  resolvedAt: timestamp("resolvedAt"),
  resolvedByAdminId: int("resolvedByAdminId").references(() => users.id),
});

export type UserSuspension = typeof userSuspensions.$inferSelect;
export type InsertUserSuspension = typeof userSuspensions.$inferInsert;

/**
 * Content moderation - Flag inappropriate content
 */
export const contentModerations = mysqlTable("contentModerations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Content details
  contentType: mysqlEnum("contentType", [
    "service_description",
    "chat_message",
    "profile_bio",
    "rating_review",
    "photo"
  ]).notNull(),
  
  contentId: int("contentId").notNull(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Flagging
  reportedBy: int("reportedBy").references(() => users.id),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description"),
  
  // Status
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
    "removed"
  ]).default("pending").notNull(),
  
  // Admin action
  reviewedByAdminId: int("reviewedByAdminId").references(() => users.id),
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type ContentModeration = typeof contentModerations.$inferSelect;
export type InsertContentModeration = typeof contentModerations.$inferInsert;

/**
 * Admin permissions and roles
 */
export const adminRoles = mysqlTable("adminRoles", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Role level
  roleType: mysqlEnum("roleType", [
    "moderator",      // Can review content and disputes
    "support",        // Can handle user support
    "financial",      // Can manage payments and disputes
    "admin",          // Full access
    "super_admin"     // Owner level
  ]).notNull(),
  
  // Permissions (JSON for flexibility)
  permissions: json("permissions"), // ["manage_users", "resolve_disputes", "view_analytics"]
  
  // Assignment
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedByAdminId: int("assignedByAdminId").references(() => users.id),
  
  // Status
  isActive: boolean("isActive").default(true),
  deactivatedAt: timestamp("deactivatedAt"),
});

export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;


/**
 * Payment transactions and Stripe integration
 */
export const paymentTransactions = mysqlTable("paymentTransactions", {
  id: int("id").autoincrement().primaryKey(),
  
  // User and package info
  userId: int("userId").notNull().references(() => users.id),
  packageId: varchar("packageId", { length: 10 }).notNull(), // "5", "20", "50", "100"
  tasklyAmount: int("tasklyAmount").notNull(),
  priceUSD: decimal("priceUSD", { precision: 10, scale: 2 }).notNull(),
  
  // Stripe integration
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  
  // Status
  status: mysqlEnum("status", [
    "pending",        // Awaiting payment
    "processing",     // Payment being processed
    "succeeded",      // Payment successful, tokens delivered
    "failed",         // Payment failed
    "cancelled",      // User cancelled
    "refunded",       // Refund issued
  ]).default("pending").notNull(),
  
  // Payment method
  paymentMethod: mysqlEnum("paymentMethod", [
    "card",           // Credit/debit card via Stripe
    "stripe_wallet",  // Apple Pay, Google Pay via Stripe
    "paypal",         // PayPal (future)
    "bank_transfer",  // Bank transfer (future)
  ]).default("card").notNull(),
  
  // Card details (encrypted in production)
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }), // visa, mastercard, etc.
  
  // Fraud detection
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low"),
  fraudCheckResult: json("fraudCheckResult"), // Stripe fraud detection data
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  completedAt: timestamp("completedAt"),
  failedAt: timestamp("failedAt"),
  refundedAt: timestamp("refundedAt"),
  
  // Notes
  failureReason: text("failureReason"),
  adminNotes: text("adminNotes"),
});
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

/**
 * Payment attempts for retry logic and fraud detection
 */
export const paymentAttempts = mysqlTable("paymentAttempts", {
  id: int("id").autoincrement().primaryKey(),
  
  transactionId: int("transactionId").notNull().references(() => paymentTransactions.id),
  userId: int("userId").notNull().references(() => users.id),
  
  // Attempt details
  attemptNumber: int("attemptNumber").notNull(),
  stripeEventId: varchar("stripeEventId", { length: 255 }),
  
  // Result
  result: mysqlEnum("result", ["success", "failed", "pending"]).notNull(),
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  
  // IP and device info for fraud detection
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type InsertPaymentAttempt = typeof paymentAttempts.$inferInsert;

/**
 * Invoices and receipts
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  
  transactionId: int("transactionId").notNull().references(() => paymentTransactions.id),
  userId: int("userId").notNull().references(() => users.id),
  
  // Invoice details
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).unique().notNull(),
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  
  // Amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: mysqlEnum("invoiceStatus", [
    "draft",
    "sent",
    "paid",
    "cancelled",
    "refunded",
  ]).default("draft").notNull(),
  
  // PDF storage
  pdfUrl: text("pdfUrl"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  paidAt: timestamp("paidAt"),
  cancelledAt: timestamp("cancelledAt"),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Refund requests and history
 */
export const refunds = mysqlTable("refunds", {
  id: int("id").autoincrement().primaryKey(),
  
  transactionId: int("transactionId").notNull().references(() => paymentTransactions.id),
  userId: int("userId").notNull().references(() => users.id),
  
  // Refund details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  
  // Stripe refund
  stripeRefundId: varchar("stripeRefundId", { length: 255 }).unique(),
  
  // Status
  status: mysqlEnum("refundStatus", [
    "pending",
    "processing",
    "succeeded",
    "failed",
    "cancelled",
  ]).default("pending").notNull(),
  
  // Approval
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedByAdminId: int("approvedByAdminId").references(() => users.id),
  processedAt: timestamp("processedAt"),
  
  // Notes
  adminNotes: text("adminNotes"),
});
export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

/**
 * Fraud detection and suspicious activity log
 */
export const fraudAlerts = mysqlTable("fraudAlerts", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  transactionId: int("transactionId").references(() => paymentTransactions.id),
  
  // Alert details
  alertType: mysqlEnum("alertType", [
    "multiple_failed_attempts",
    "unusual_location",
    "high_velocity",
    "card_testing",
    "chargeback_risk",
    "velocity_limit_exceeded",
  ]).notNull(),
  
  description: text("description"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  
  // Action taken
  action: mysqlEnum("action", [
    "flagged",
    "blocked",
    "requires_verification",
    "manual_review",
    "no_action",
  ]).default("flagged").notNull(),
  
  // Resolution
  resolvedAt: timestamp("resolvedAt"),
  resolvedByAdminId: int("resolvedByAdminId").references(() => users.id),
  resolutionNotes: text("resolutionNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;

/**
 * Trust Badges: visual indicators of user trustworthiness based on reviews
 */
export const trustBadges = mysqlTable("trustBadges", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull().references(() => users.id),
  
  // Badge type
  type: mysqlEnum("type", [
    "trusted",           // 10+ five-star reviews
    "highly_trusted",    // 25+ five-star reviews
    "verified_expert",   // 50+ five-star reviews
    "community_leader",  // 100+ five-star reviews
    "perfect_rating",    // 100% five-star average (min 5 reviews)
    "responsive",        // Quick response time (avg < 2 hours)
    "professional",      // Consistent high quality
  ]).notNull(),
  
  // Badge metadata
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(), // emoji or icon name
  color: varchar("color", { length: 20 }).default("blue"), // badge color
  
  // Criteria met
  fiveStarCount: int("fiveStarCount").default(0),
  totalReviews: int("totalReviews").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  
  // Status
  isActive: boolean("isActive").default(true),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrustBadge = typeof trustBadges.$inferSelect;
export type InsertTrustBadge = typeof trustBadges.$inferInsert;
