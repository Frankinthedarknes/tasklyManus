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
