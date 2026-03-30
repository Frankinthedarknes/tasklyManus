import { eq, and, or, desc, asc, sql, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  wallets,
  tokenTransactions,
  services,
  escrowTransactions,
  chatMessages,
  conversations,
  ratings,
  achievements,
  freeTokenPromotions,
  savedServices,
  disputes,
  auditLogs,
  userSuspensions,
  contentModerations,
  adminRoles,
  paymentTransactions,
  paymentAttempts,
  invoices,
  refunds,
  fraudAlerts,
  trustBadges,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertUser>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(users).set(updates).where(eq(users.id, userId));
  return getUserById(userId);
}

// Wallet operations
export async function getOrCreateWallet(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  let wallet = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (wallet.length === 0) {
    await db.insert(wallets).values({
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    });
    wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);
  }

  return wallet[0];
}

export async function updateWalletBalance(userId: number, delta: number) {
  const db = await getDb();
  if (!db) return undefined;

  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return undefined;

  const newBalance = Math.max(0, (wallet.balance ?? 0) + delta);

  await db
    .update(wallets)
    .set({
      balance: newBalance,
      totalSpent: delta < 0 ? (wallet.totalSpent ?? 0) - delta : (wallet.totalSpent ?? 0),
      totalEarned: delta > 0 ? (wallet.totalEarned ?? 0) + delta : (wallet.totalEarned ?? 0),
    })
    .where(eq(wallets.userId, userId));

  return getOrCreateWallet(userId);
}

// Token transactions
export async function createTokenTransaction(
  userId: number,
  type: "purchase" | "earn" | "spend" | "refund" | "withdrawal",
  amount: number,
  description?: string,
  relatedServiceId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(tokenTransactions).values({
    userId,
    type,
    amount,
    description,
    relatedServiceId,
    status: "completed",
  });

  return result;
}

// Services
export async function createService(
  data: Partial<typeof services.$inferInsert>
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(services).values(data as any);
  const serviceId = (result as any).insertId || result[0];

  return getServiceById(serviceId);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getNearbyServices(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  type?: "offer" | "request",
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];

  // Simple distance calculation (Haversine formula approximation for small distances)
  // In production, use PostGIS or similar
  const conditions = [
    gte(services.latitude, latitude - radiusKm / 111),
    lte(services.latitude, latitude + radiusKm / 111),
    gte(services.longitude, longitude - radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))),
    lte(services.longitude, longitude + radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))),
    eq(services.status, "published"),
  ];

  if (type) {
    conditions.push(eq(services.type, type));
  }

  const result = await db
    .select()
    .from(services)
    .where(and(...conditions))
    .orderBy(desc(services.createdAt))
    .limit(limit);

  return result;
}

// Escrow transactions
export async function createEscrowTransaction(
  serviceId: number,
  requesterId: number,
  providerId: number,
  amountInTasklys: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const autoCloseAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const result = await db.insert(escrowTransactions).values({
    serviceId,
    requesterId,
    providerId,
    amountInTasklys,
    status: "pending",
    autoCloseAt,
  });

  const escrowId = (result as any).insertId || result[0];
  return getEscrowTransactionById(escrowId);
}

export async function getEscrowTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateEscrowStatus(
  id: number,
  status:
    | "pending"
    | "locked"
    | "in_progress"
    | "completed"
    | "refunded"
    | "disputed"
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(escrowTransactions)
    .set({ status, updatedAt: new Date() })
    .where(eq(escrowTransactions.id, id));

  return getEscrowTransactionById(id);
}

// Chat
export async function getOrCreateConversation(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const normalizedUser1 = Math.min(user1Id, user2Id);
  const normalizedUser2 = Math.max(user1Id, user2Id);

  let conversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.user1Id, normalizedUser1),
        eq(conversations.user2Id, normalizedUser2)
      )
    )
    .limit(1);

  if (conversation.length === 0) {
    await db.insert(conversations).values({
      user1Id: normalizedUser1,
      user2Id: normalizedUser2,
    });

    conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.user1Id, normalizedUser1),
          eq(conversations.user2Id, normalizedUser2)
        )
      )
      .limit(1);
  }

  return conversation[0];
}

export async function addChatMessage(
  conversationId: number,
  senderId: number,
  content: string,
  isQuickMessage: boolean = false
) {
  const db = await getDb();
  if (!db) return undefined;

  // Detect security flags
  const flaggedPatterns =
    /(\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}|http|www\.|@|\.com|\.co|email|whatsapp|telegram|instagram)/i;
  const flaggedForSecurity = flaggedPatterns.test(content);

  const result = await db.insert(chatMessages).values({
    conversationId,
    senderId,
    content,
    isQuickMessage,
    flaggedForSecurity,
  });

  return result[0];
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return result.reverse();
}

// Ratings
export async function createRating(
  serviceId: number,
  raterId: number,
  ratedUserId: number,
  score: number,
  review?: string,
  categories?: Record<string, number>,
  badges?: string[]
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(ratings).values({
    serviceId,
    raterId,
    ratedUserId,
    score,
    review,
    categories,
    badges,
  });

  return result[0];
}

export async function getUserRatings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(ratings)
    .where(eq(ratings.ratedUserId, userId));

  return result;
}

// Gamification
export async function unlockAchievement(
  userId: number,
  type: string,
  title: string,
  description?: string,
  pointsAwarded: number = 10
) {
  const db = await getDb();
  if (!db) return undefined;

  // Check if already unlocked
  const existing = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.type, type)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(achievements).values({
    userId,
    type,
    title,
    description,
    pointsAwarded,
  });

  return result[0];
}

export async function updateUserLevel(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const user = await getUserById(userId);
  if (!user) return undefined;

  // Level progression: 0-99 (Nuevo), 100-249 (Activo), 250-499 (Confiable), 500-999 (Pro), 1000+ (Leyenda)
  let newLevel = 1;
  const points = user.totalPoints ?? 0;
  if (points >= 1000) newLevel = 5;
  else if (points >= 500) newLevel = 4;
  else if (points >= 250) newLevel = 3;
  else if (points >= 100) newLevel = 2;

  if (newLevel !== user.level) {
    await db
      .update(users)
      .set({ level: newLevel })
      .where(eq(users.id, userId));
  }

  return newLevel;
}

// Free token promotions
export async function createFreeTokenPromotion(
  userId: number,
  amount: number = 5,
  expirationHours: number = 48
) {
  const db = await getDb();
  if (!db) return undefined;

  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  const result = await db.insert(freeTokenPromotions).values({
    userId,
    type: "onboarding",
    amount,
    expiresAt,
  });

  return result[0];
}

export async function getActiveFreeTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const result = await db
    .select()
    .from(freeTokenPromotions)
    .where(
      and(
        eq(freeTokenPromotions.userId, userId),
        eq(freeTokenPromotions.used, false),
        gte(freeTokenPromotions.expiresAt, now)
      )
    );

  return result;
}

// Saved services
export async function saveService(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db
    .select()
    .from(savedServices)
    .where(
      and(
        eq(savedServices.userId, userId),
        eq(savedServices.serviceId, serviceId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(savedServices).values({
    userId,
    serviceId,
  });

  return result[0];
}

export async function getSavedServices(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(savedServices)
    .where(eq(savedServices.userId, userId))
    .orderBy(desc(savedServices.createdAt));

  return result;
}

export async function removeSavedService(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(savedServices)
    .where(
      and(
        eq(savedServices.userId, userId),
        eq(savedServices.serviceId, serviceId)
      )
    );
}


// ============ ADMIN PANEL QUERIES ============

// User Management
export async function getAllUsers(
  limit: number = 50,
  offset: number = 0,
  filters?: { role?: string; level?: number; verified?: boolean }
) {
  const db = await getDb();
  if (!db) return [];

  if (filters?.role) {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, filters.role as any))
      .limit(limit)
      .offset(offset);
  }

  return await db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);
}

export async function suspendUser(
  userId: number,
  reason: string,
  severity: "warning" | "temporary" | "permanent",
  adminId: number,
  suspendUntil?: Date
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(userSuspensions).values({
    userId,
    reason,
    severity,
    suspendedByAdminId: adminId,
    suspendedUntil: suspendUntil,
  });

  // Log the action
  await logAdminAction(adminId, "suspend_user", "user", userId, { reason, severity });

  return result[0];
}

export async function unsuspendUser(userId: number, adminId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(userSuspensions)
    .set({
      resolvedAt: new Date(),
      resolvedByAdminId: adminId,
    })
    .where(eq(userSuspensions.userId, userId));

  await logAdminAction(adminId, "unsuspend_user", "user", userId);
}

export async function getUserSuspensions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(userSuspensions)
    .where(eq(userSuspensions.userId, userId))
    .orderBy(desc(userSuspensions.suspendedAt));

  return result;
}

// Disputes Management
export async function createDispute(
  reporterId: number,
  respondentId: number,
  serviceId: number,
  title: string,
  description: string,
  category: string,
  evidence?: any[]
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(disputes).values({
    reporterId,
    respondentId,
    serviceId,
    title,
    description,
    category: category as any,
    evidence,
  });

  return result[0];
}

export async function getDisputes(
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.status, status as any))
      .orderBy(desc(disputes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return await db
    .select()
    .from(disputes)
    .orderBy(desc(disputes.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function assignDisputeToAdmin(
  disputeId: number,
  adminId: number
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(disputes)
    .set({
      assignedAdminId: adminId,
      status: "in_review",
    })
    .where(eq(disputes.id, disputeId));

  await logAdminAction(adminId, "assign_dispute", "dispute", disputeId);
}

export async function resolveDispute(
  disputeId: number,
  resolution: string,
  resolutionType: string,
  adminId: number
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(disputes)
    .set({
      status: "resolved",
      resolution,
      resolutionType: resolutionType as any,
      resolvedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId));

  await logAdminAction(adminId, "resolve_dispute", "dispute", disputeId, {
    resolution,
    resolutionType,
  });
}

// Audit Logging
export async function logAdminAction(
  adminId: number,
  action: string,
  entityType: string,
  entityId: number,
  changes?: Record<string, any>,
  reason?: string
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    adminId,
    action,
    entityType,
    entityId,
    changes,
    reason,
  });
}

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  adminId?: number
) {
  const db = await getDb();
  if (!db) return [];

  if (adminId) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.adminId, adminId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

// Content Moderation
export async function createContentModeration(
  contentType: string,
  contentId: number,
  userId: number,
  reason: string,
  description?: string,
  reportedBy?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(contentModerations).values({
    contentType: contentType as any,
    contentId,
    userId,
    reason,
    description,
    reportedBy,
  });

  return result[0];
}

export async function getPendingContentModerations(
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(contentModerations)
    .where(eq(contentModerations.status, "pending"))
    .orderBy(asc(contentModerations.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function reviewContentModeration(
  moderationId: number,
  status: "approved" | "rejected" | "removed",
  adminId: number,
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(contentModerations)
    .set({
      status,
      reviewedByAdminId: adminId,
      adminNotes,
      reviewedAt: new Date(),
    })
    .where(eq(contentModerations.id, moderationId));

  await logAdminAction(adminId, `review_content_${status}`, "content", moderationId, {
    adminNotes,
  });
}

// Admin Roles
export async function assignAdminRole(
  userId: number,
  roleType: string,
  permissions: string[],
  assignedByAdminId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(adminRoles).values({
    userId,
    roleType: roleType as any,
    permissions,
    assignedByAdminId,
  });

  await logAdminAction(assignedByAdminId, "assign_admin_role", "user", userId, {
    roleType,
    permissions,
  });

  return result[0];
}

export async function getAdminRole(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(adminRoles)
    .where(and(eq(adminRoles.userId, userId), eq(adminRoles.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Dashboard Statistics
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  // Total users
  const totalUsersResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(users);
  const totalUsers = (totalUsersResult[0]?.count as number) || 0;

  // Active disputes
  const activeDisputesResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(disputes)
    .where(eq(disputes.status, "open"));
  const activeDisputes = (activeDisputesResult[0]?.count as number) || 0;

  // Pending content
  const pendingContentResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(contentModerations)
    .where(eq(contentModerations.status, "pending"));
  const pendingContent = (pendingContentResult[0]?.count as number) || 0;

  // Recent transactions
  const recentTransactionsResult = await db
    .select({ count: sql`COUNT(*)`, total: sql`SUM(amountInTasklys)` })
    .from(escrowTransactions)
    .where(
      gte(
        escrowTransactions.createdAt,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
    );

  return {
    totalUsers,
    activeDisputes,
    pendingContent,
    recentTransactions: {
      count: (recentTransactionsResult[0]?.count as number) || 0,
      total: (recentTransactionsResult[0]?.total as number) || 0,
    },
  };
}




// Payment transaction helpers
export async function createPaymentTransaction(
  userId: number,
  packageId: string,
  tasklyAmount: number,
  priceUSD: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(paymentTransactions).values({
    userId,
    packageId,
    tasklyAmount,
    priceUSD: priceUSD.toString(),
    status: "pending",
    paymentMethod: "card",
  });

  return result;
}

export async function getPaymentTransaction(transactionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.id, transactionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentTransactionStatus(
  transactionId: number,
  status: string,
  stripePaymentIntentId?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const updates: any = {
    status,
    processedAt: new Date(),
  };

  if (stripePaymentIntentId) {
    updates.stripePaymentIntentId = stripePaymentIntentId;
  }

  if (status === "succeeded") {
    updates.completedAt = new Date();
  } else if (status === "failed") {
    updates.failedAt = new Date();
  }

  const result = await db
    .update(paymentTransactions)
    .set(updates)
    .where(eq(paymentTransactions.id, transactionId));

  return result;
}

export async function getUserPaymentHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.userId, userId))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(limit);

  return result;
}

export async function createPaymentAttempt(
  transactionId: number,
  userId: number,
  attemptNumber: number,
  result: string,
  errorCode?: string,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const insertResult = await db.insert(paymentAttempts).values({
    transactionId,
    userId,
    attemptNumber,
    result: result as any,
    errorCode,
    errorMessage,
  });

  return insertResult;
}

export async function createInvoice(
  transactionId: number,
  userId: number,
  invoiceNumber: string,
  subtotal: number,
  tax: number,
  total: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(invoices).values({
    transactionId,
    userId,
    invoiceNumber,
    subtotal: subtotal.toString(),
    tax: tax.toString(),
    total: total.toString(),
    status: "draft",
  });

  return result;
}

export async function updateInvoiceStatus(invoiceId: number, status: string) {
  const db = await getDb();
  if (!db) return undefined;

  const updates: any = { status };

  if (status === "paid") {
    updates.paidAt = new Date();
  } else if (status === "sent") {
    updates.sentAt = new Date();
  } else if (status === "cancelled") {
    updates.cancelledAt = new Date();
  }

  const result = await db
    .update(invoices)
    .set(updates)
    .where(eq(invoices.id, invoiceId));

  return result;
}

export async function createRefund(
  transactionId: number,
  userId: number,
  amount: number,
  reason: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(refunds).values({
    transactionId,
    userId,
    amount: amount.toString(),
    reason,
  });

  return result;
}

export async function createFraudAlert(
  userId: number,
  alertType: string,
  severity: string,
  description?: string,
  transactionId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(fraudAlerts).values({
    userId,
    transactionId,
    alertType: alertType as any,
    severity: severity as any,
    description,
    action: "flagged",
  });

  return result;
}

export async function getUserFraudAlerts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(fraudAlerts)
    .where(eq(fraudAlerts.userId, userId))
    .orderBy(desc(fraudAlerts.createdAt))
    .limit(limit);

  return result;
}

// Get pending reviews for a user (completed services without rating from this user)
export async function getPendingReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get completed services where user is either creator or assigned, but hasn't rated yet
  const completedServices = await db
    .select({
      serviceId: services.id,
      serviceName: services.title,
      serviceStatus: services.status,
      createdById: services.createdById,
      assignedToId: services.assignedToId,
      completedAt: services.completedAt,
    })
    .from(services)
    .where(
      and(
        eq(services.status, "completed"),
        or(
          eq(services.createdById, userId),
          eq(services.assignedToId, userId)
        )
      )
    );

  // For each service, check if user has already rated
  const pendingReviews = [];
  
  for (const service of completedServices) {
    // Determine who the user should rate
    const otherUserId = service.createdById === userId ? service.assignedToId : service.createdById;
    
    if (!otherUserId) continue;

    // Check if rating already exists
    const existingRating = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.serviceId, service.serviceId),
          eq(ratings.raterId, userId),
          eq(ratings.ratedUserId, otherUserId)
        )
      )
      .limit(1);

    if (existingRating.length === 0) {
      // Get the other user's name
      const otherUser = await getUserById(otherUserId);
      
      pendingReviews.push({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        providerName: otherUser?.name || "Usuario",
        ratedUserId: otherUserId,
        completedAt: service.completedAt,
      });
    }
  }

  return pendingReviews;
}

// Check if user can interact (no pending reviews)
export async function canUserInteract(userId: number): Promise<boolean> {
  const pendingReviews = await getPendingReviews(userId);
  return pendingReviews.length === 0;
}

// Trust Badges
export async function calculateAndAwardBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all ratings for this user
  const userRatings = await db
    .select()
    .from(ratings)
    .where(eq(ratings.ratedUserId, userId));

  if (userRatings.length === 0) return [];

  const fiveStarCount = userRatings.filter((r) => r.score === 5).length;
  const totalReviews = userRatings.length;
  const averageRating = userRatings.reduce((sum, r) => sum + (r.score ?? 0), 0) / totalReviews;

  const badgesToAward: any[] = [];

  // Trusted: 10+ five-star reviews
  if (fiveStarCount >= 10) {
    badgesToAward.push({
      type: "trusted",
      title: "Confiable",
      description: "10+ reseñas de 5 estrellas",
      icon: "⭐",
      color: "blue",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Highly Trusted: 25+ five-star reviews
  if (fiveStarCount >= 25) {
    badgesToAward.push({
      type: "highly_trusted",
      title: "Altamente Confiable",
      description: "25+ reseñas de 5 estrellas",
      icon: "✨",
      color: "purple",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Verified Expert: 50+ five-star reviews
  if (fiveStarCount >= 50) {
    badgesToAward.push({
      type: "verified_expert",
      title: "Experto Verificado",
      description: "50+ reseñas de 5 estrellas",
      icon: "🏆",
      color: "gold",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Community Leader: 100+ five-star reviews
  if (fiveStarCount >= 100) {
    badgesToAward.push({
      type: "community_leader",
      title: "Líder de Comunidad",
      description: "100+ reseñas de 5 estrellas",
      icon: "👑",
      color: "gold",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Perfect Rating: 100% five-star average (min 5 reviews)
  if (totalReviews >= 5 && averageRating === 5.0) {
    badgesToAward.push({
      type: "perfect_rating",
      title: "Calificación Perfecta",
      description: "100% reseñas de 5 estrellas",
      icon: "💎",
      color: "cyan",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Professional: Consistent high quality (avg >= 4.8 with 10+ reviews)
  if (totalReviews >= 10 && averageRating >= 4.8) {
    badgesToAward.push({
      type: "professional",
      title: "Profesional",
      description: "Calidad consistentemente alta (4.8+ promedio)",
      icon: "💼",
      color: "slate",
      fiveStarCount,
      totalReviews,
      averageRating: averageRating.toString(),
    });
  }

  // Award badges
  const awardedBadges = [];
  for (const badge of badgesToAward) {
    // Check if badge already exists
    const existing = await db
      .select()
      .from(trustBadges)
      .where(
        and(
          eq(trustBadges.userId, userId),
          eq(trustBadges.type, badge.type as any),
          eq(trustBadges.isActive, true)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      const result = await db.insert(trustBadges).values({
        userId,
        ...badge,
      });
      awardedBadges.push(result);
    }
  }

  return awardedBadges;
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(trustBadges)
    .where(and(eq(trustBadges.userId, userId), eq(trustBadges.isActive, true)))
    .orderBy(desc(trustBadges.earnedAt));

  return result;
}

export async function revokeBadge(badgeId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .update(trustBadges)
    .set({
      isActive: false,
      revokedAt: new Date(),
    })
    .where(eq(trustBadges.id, badgeId));

  return result;
}
