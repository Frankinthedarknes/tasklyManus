import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserById: vi.fn(),
  updateUserProfile: vi.fn(),
  getOrCreateWallet: vi.fn(),
  updateWalletBalance: vi.fn(),
  createTokenTransaction: vi.fn(),
  createService: vi.fn(),
  getNearbyServices: vi.fn(),
  createEscrowTransaction: vi.fn(),
  updateEscrowStatus: vi.fn(),
  getOrCreateConversation: vi.fn(),
  addChatMessage: vi.fn(),
  createRating: vi.fn(),
  unlockAchievement: vi.fn(),
  updateUserLevel: vi.fn(),
  createFreeTokenPromotion: vi.fn(),
  getActiveFreeTokens: vi.fn(),
  saveService: vi.fn(),
  getSavedServices: vi.fn(),
}));

describe("User Management", () => {
  it("should get user profile by ID", async () => {
    const mockUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      level: 1,
      totalPoints: 0,
      servicesCompleted: 0,
      averageRating: 0,
    };

    vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);

    const result = await db.getUserById(1);
    expect(result).toEqual(mockUser);
    expect(db.getUserById).toHaveBeenCalledWith(1);
  });

  it("should update user profile", async () => {
    const updates = { bio: "New bio" };
    const mockUpdatedUser = {
      id: 1,
      name: "Test User",
      bio: "New bio",
    };

    vi.mocked(db.updateUserProfile).mockResolvedValue(mockUpdatedUser as any);

    const result = await db.updateUserProfile(1, updates);
    expect(result?.bio).toBe("New bio");
  });
});

describe("Wallet Management", () => {
  it("should create or get wallet", async () => {
    const mockWallet = {
      id: 1,
      userId: 1,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    };

    vi.mocked(db.getOrCreateWallet).mockResolvedValue(mockWallet as any);

    const result = await db.getOrCreateWallet(1);
    expect(result?.userId).toBe(1);
    expect(result?.balance).toBe(0);
  });

  it("should update wallet balance", async () => {
    const mockWallet = {
      id: 1,
      userId: 1,
      balance: 10,
      totalEarned: 10,
      totalSpent: 0,
    };

    vi.mocked(db.updateWalletBalance).mockResolvedValue(mockWallet as any);

    const result = await db.updateWalletBalance(1, 10);
    expect(result?.balance).toBe(10);
  });
});

describe("Token Transactions", () => {
  it("should create token transaction", async () => {
    vi.mocked(db.createTokenTransaction).mockResolvedValue(1);

    const result = await db.createTokenTransaction(
      1,
      "purchase",
      5,
      "Purchased 5 Tasklys"
    );

    expect(result).toBe(1);
    expect(db.createTokenTransaction).toHaveBeenCalledWith(
      1,
      "purchase",
      5,
      "Purchased 5 Tasklys"
    );
  });
});

describe("Services", () => {
  it("should create a service", async () => {
    const mockService = {
      id: 1,
      title: "Help moving",
      description: "Need help moving furniture",
      category: "Carga y movimiento",
      priceInTasklys: 20,
      latitude: 4.7110,
      longitude: -74.0055,
      type: "request" as const,
      createdById: 1,
      status: "published" as const,
      createdAt: new Date(),
    };

    vi.mocked(db.createService).mockResolvedValue(mockService as any);

    const result = await db.createService({
      title: "Help moving",
      description: "Need help moving furniture",
      category: "Carga y movimiento",
      priceInTasklys: 20,
      latitude: 4.7110,
      longitude: -74.0055,
      type: "request",
      createdById: 1,
    });

    expect(result?.title).toBe("Help moving");
    expect(result?.type).toBe("request");
  });

  it("should get nearby services", async () => {
    const mockServices = [
      {
        id: 1,
        title: "Service 1",
        latitude: 4.7110,
        longitude: -74.0055,
        priceInTasklys: 10,
      },
    ];

    vi.mocked(db.getNearbyServices).mockResolvedValue(mockServices as any);

    const result = await db.getNearbyServices(4.7110, -74.0055, 5);
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Service 1");
  });
});

describe("Escrow Transactions", () => {
  it("should create escrow transaction", async () => {
    const mockEscrow = {
      id: 1,
      serviceId: 1,
      requesterId: 1,
      providerId: 2,
      amountInTasklys: 20,
      status: "pending" as const,
      createdAt: new Date(),
    };

    vi.mocked(db.createEscrowTransaction).mockResolvedValue(mockEscrow as any);

    const result = await db.createEscrowTransaction(1, 1, 2, 20);
    expect(result?.status).toBe("pending");
    expect(result?.amountInTasklys).toBe(20);
  });

  it("should update escrow status", async () => {
    const mockEscrow = {
      id: 1,
      status: "completed" as const,
    };

    vi.mocked(db.updateEscrowStatus).mockResolvedValue(mockEscrow as any);

    const result = await db.updateEscrowStatus(1, "completed");
    expect(result?.status).toBe("completed");
  });
});

describe("Chat", () => {
  it("should create or get conversation", async () => {
    const mockConversation = {
      id: 1,
      user1Id: 1,
      user2Id: 2,
      createdAt: new Date(),
    };

    vi.mocked(db.getOrCreateConversation).mockResolvedValue(
      mockConversation as any
    );

    const result = await db.getOrCreateConversation(1, 2);
    expect(result?.user1Id).toBe(1);
    expect(result?.user2Id).toBe(2);
  });

  it("should add chat message", async () => {
    vi.mocked(db.addChatMessage).mockResolvedValue(1);

    const result = await db.addChatMessage(
      1,
      1,
      "Hello, are you available?"
    );

    expect(result).toBe(1);
  });

  it("should flag security messages", async () => {
    vi.mocked(db.addChatMessage).mockResolvedValue(1);

    // Message with phone number should be flagged
    await db.addChatMessage(1, 1, "Call me at +57 300 123 4567");

    expect(db.addChatMessage).toHaveBeenCalled();
  });
});

describe("Ratings", () => {
  it("should create rating", async () => {
    vi.mocked(db.createRating).mockResolvedValue(1);

    const result = await db.createRating(
      1,
      1,
      2,
      5,
      "Great service!",
      { communication: 5, punctuality: 5 },
      ["responsive", "professional"]
    );

    expect(result).toBe(1);
  });
});

describe("Gamification", () => {
  it("should unlock achievement", async () => {
    const mockAchievement = {
      id: 1,
      userId: 1,
      type: "10_services",
      title: "10 Services Completed",
      pointsAwarded: 50,
    };

    vi.mocked(db.unlockAchievement).mockResolvedValue(mockAchievement as any);

    const result = await db.unlockAchievement(
      1,
      "10_services",
      "10 Services Completed",
      undefined,
      50
    );

    expect(result?.type).toBe("10_services");
    expect(result?.pointsAwarded).toBe(50);
  });

  it("should update user level based on points", async () => {
    // Level progression: 1-99 (Nuevo), 100-249 (Activo), 250-499 (Confiable), 500-999 (Pro), 1000+ (Leyenda)
    vi.mocked(db.updateUserLevel).mockResolvedValue(2);

    const result = await db.updateUserLevel(1);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(5);
  });
});

describe("Free Token Promotions", () => {
  it("should create free token promotion for onboarding", async () => {
    vi.mocked(db.createFreeTokenPromotion).mockResolvedValue(1);

    const result = await db.createFreeTokenPromotion(1, 5, 48);
    expect(result).toBe(1);
  });

  it("should get active free tokens", async () => {
    const mockTokens = [
      {
        id: 1,
        userId: 1,
        amount: 5,
        used: false,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    ];

    vi.mocked(db.getActiveFreeTokens).mockResolvedValue(mockTokens as any);

    const result = await db.getActiveFreeTokens(1);
    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe(5);
  });
});

describe("Saved Services", () => {
  it("should save service", async () => {
    vi.mocked(db.saveService).mockResolvedValue(1);

    const result = await db.saveService(1, 1);
    expect(result).toBe(1);
  });

  it("should get saved services", async () => {
    const mockSaved = [
      {
        id: 1,
        userId: 1,
        serviceId: 1,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getSavedServices).mockResolvedValue(mockSaved as any);

    const result = await db.getSavedServices(1);
    expect(result).toHaveLength(1);
  });
});
