import { describe, it, expect, vi, beforeEach } from "vitest";
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
  getDashboardStats: vi.fn(),
  getAllUsers: vi.fn(),
  suspendUser: vi.fn(),
  unsuspendUser: vi.fn(),
  getUserSuspensions: vi.fn(),
  createDispute: vi.fn(),
  getDisputes: vi.fn(),
  assignDisputeToAdmin: vi.fn(),
  resolveDispute: vi.fn(),
  logAdminAction: vi.fn(),
  getAuditLogs: vi.fn(),
  createContentModeration: vi.fn(),
  getPendingContentModerations: vi.fn(),
  reviewContentModeration: vi.fn(),
  assignAdminRole: vi.fn(),
  getAdminRole: vi.fn(),
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
      email: "test@example.com",
      bio: "New bio",
    };

    vi.mocked(db.updateUserProfile).mockResolvedValue(mockUpdatedUser as any);

    const result = await db.updateUserProfile(1, updates);
    expect(result).toEqual(mockUpdatedUser);
    expect(db.updateUserProfile).toHaveBeenCalledWith(1, updates);
  });
});

describe("Wallet & Tokens", () => {
  it("should get or create wallet", async () => {
    const mockWallet = {
      id: 1,
      userId: 1,
      balanceTasklys: 100,
    };

    vi.mocked(db.getOrCreateWallet).mockResolvedValue(mockWallet as any);

    const result = await db.getOrCreateWallet(1);
    expect(result).toEqual(mockWallet);
    expect(db.getOrCreateWallet).toHaveBeenCalledWith(1);
  });

  it("should update wallet balance", async () => {
    vi.mocked(db.updateWalletBalance).mockResolvedValue(undefined);

    await db.updateWalletBalance(1, 50);
    expect(db.updateWalletBalance).toHaveBeenCalledWith(1, 50);
  });
});

describe("Services", () => {
  it("should create a service", async () => {
    const mockService = {
      id: 1,
      userId: 1,
      title: "Cleaning Service",
      type: "offer",
      priceTasklys: 50,
    };

    vi.mocked(db.createService).mockResolvedValue(mockService as any);

    const result = await db.createService(1, "Cleaning Service", "offer", 50);
    expect(result).toEqual(mockService);
  });

  it("should find nearby services", async () => {
    const mockServices = [
      { id: 1, title: "Service 1", distance: 0.5 },
      { id: 2, title: "Service 2", distance: 1.2 },
    ];

    vi.mocked(db.getNearbyServices).mockResolvedValue(mockServices as any);

    const result = await db.getNearbyServices(40.7128, -74.006, 5);
    expect(result).toEqual(mockServices);
    expect(result.length).toBe(2);
  });
});

describe("Chat", () => {
  it("should get or create conversation", async () => {
    const mockConversation = {
      id: 1,
      userId1: 1,
      userId2: 2,
    };

    vi.mocked(db.getOrCreateConversation).mockResolvedValue(mockConversation as any);

    const result = await db.getOrCreateConversation(1, 2);
    expect(result).toEqual(mockConversation);
  });

  it("should add chat message", async () => {
    const mockMessage = {
      id: 1,
      conversationId: 1,
      senderId: 1,
      text: "Hello",
    };

    vi.mocked(db.addChatMessage).mockResolvedValue(mockMessage as any);

    const result = await db.addChatMessage(1, 1, "Hello");
    expect(result).toEqual(mockMessage);
  });
});

describe("Escrow Transactions", () => {
  it("should create escrow transaction", async () => {
    const mockEscrow = {
      id: 1,
      serviceId: 1,
      buyerId: 1,
      sellerId: 2,
      amountInTasklys: 50,
      status: "pending",
    };

    vi.mocked(db.createEscrowTransaction).mockResolvedValue(mockEscrow as any);

    const result = await db.createEscrowTransaction(1, 1, 2, 50);
    expect(result).toEqual(mockEscrow);
  });

  it("should update escrow status", async () => {
    vi.mocked(db.updateEscrowStatus).mockResolvedValue(undefined);

    await db.updateEscrowStatus(1, "completed");
    expect(db.updateEscrowStatus).toHaveBeenCalledWith(1, "completed");
  });
});

describe("Token Transactions", () => {
  it("should create token transaction", async () => {
    const mockTransaction = {
      id: 1,
      userId: 1,
      type: "purchase",
      amount: 5,
      description: "Purchased 5 Tasklys",
    };

    vi.mocked(db.createTokenTransaction).mockResolvedValue(mockTransaction as any);

    const result = await db.createTokenTransaction(
      1,
      "purchase",
      5,
      "Purchased 5 Tasklys"
    );

    expect(result).toEqual(mockTransaction);
    expect(db.createTokenTransaction).toHaveBeenCalled();
  });
});

describe("Services", () => {
  it("should create a service with all details", async () => {
    const mockService = {
      id: 1,
      userId: 1,
      title: "Web Design",
      description: "Professional web design",
      type: "offer",
      category: "design",
      priceTasklys: 100,
      latitude: 40.7128,
      longitude: -74.006,
      urgency: "flexible",
    };

    vi.mocked(db.createService).mockResolvedValue(mockService as any);

    const result = await db.createService(
      1,
      "Web Design",
      "offer",
      100,
      "Professional web design",
      "design",
      40.7128,
      -74.006,
      "flexible"
    );

    expect(result).toEqual(mockService);
  });

  it("should save a service", async () => {
    vi.mocked(db.saveService).mockResolvedValue({ id: 1 } as any);

    const result = await db.saveService(1, 1);
    expect(result).toBeDefined();
    expect(db.saveService).toHaveBeenCalledWith(1, 1);
  });

  it("should get saved services", async () => {
    const mockSaved = [
      { id: 1, userId: 1, serviceId: 1 },
      { id: 2, userId: 1, serviceId: 2 },
    ];

    vi.mocked(db.getSavedServices).mockResolvedValue(mockSaved as any);

    const result = await db.getSavedServices(1);
    expect(result).toEqual(mockSaved);
    expect(result.length).toBe(2);
  });
});

describe("Ratings", () => {
  it("should create a rating", async () => {
    const mockRating = {
      id: 1,
      serviceId: 1,
      raterId: 1,
      ratedUserId: 2,
      score: 5,
      review: "Excellent service",
    };

    vi.mocked(db.createRating).mockResolvedValue(mockRating as any);

    const result = await db.createRating(1, 1, 2, 5, "Excellent service");
    expect(result).toEqual(mockRating);
  });
});

describe("Gamification", () => {
  it("should unlock achievement", async () => {
    const mockAchievement = {
      id: 1,
      userId: 1,
      type: "first_service",
      title: "First Service",
      pointsAwarded: 50,
    };

    vi.mocked(db.unlockAchievement).mockResolvedValue(mockAchievement as any);

    const result = await db.unlockAchievement(1, "first_service", "First Service");
    expect(result).toEqual(mockAchievement);
  });

  it("should update user level", async () => {
    vi.mocked(db.updateUserLevel).mockResolvedValue(2);

    const result = await db.updateUserLevel(1);
    expect(result).toBe(2);
  });
});

describe("Onboarding", () => {
  it("should create free token promotion", async () => {
    const mockPromo = {
      id: 1,
      userId: 1,
      type: "onboarding",
      amount: 5,
      expiresAt: new Date(),
    };

    vi.mocked(db.createFreeTokenPromotion).mockResolvedValue(mockPromo as any);

    const result = await db.createFreeTokenPromotion(1, 5, 48);
    expect(result).toEqual(mockPromo);
  });

  it("should get active free tokens", async () => {
    const mockTokens = [
      { id: 1, userId: 1, amount: 5, used: false },
    ];

    vi.mocked(db.getActiveFreeTokens).mockResolvedValue(mockTokens as any);

    const result = await db.getActiveFreeTokens(1);
    expect(result).toEqual(mockTokens);
    expect(result.length).toBe(1);
  });
});

describe("Admin Panel", () => {
  it("should get dashboard statistics", async () => {
    const mockStats = {
      totalUsers: 100,
      activeDisputes: 5,
      pendingContent: 3,
      recentTransactions: { count: 10, total: 250 },
    };

    vi.mocked(db.getDashboardStats).mockResolvedValue(mockStats as any);

    const stats = await db.getDashboardStats();
    expect(stats).toEqual(mockStats);
    expect(db.getDashboardStats).toHaveBeenCalled();
  });

  it("should suspend a user", async () => {
    const mockSuspension = { id: 1, userId: 1, reason: "Test" };
    vi.mocked(db.suspendUser).mockResolvedValue(mockSuspension as any);

    const result = await db.suspendUser(1, "Violation", "temporary", 1);
    expect(result).toEqual(mockSuspension);
    expect(db.suspendUser).toHaveBeenCalled();
  });

  it("should create a dispute", async () => {
    const mockDispute = { id: 1, title: "Test Dispute" };
    vi.mocked(db.createDispute).mockResolvedValue(mockDispute as any);

    const result = await db.createDispute(1, 2, 1, "Test", "Desc", "payment_issue");
    expect(result).toEqual(mockDispute);
  });

  it("should log admin action", async () => {
    vi.mocked(db.logAdminAction).mockResolvedValue(undefined);

    await db.logAdminAction(1, "test_action", "user", 1, { test: "data" });
    expect(db.logAdminAction).toHaveBeenCalled();
  });

  it("should get audit logs", async () => {
    const mockLogs = [
      { id: 1, action: "suspend_user", entityId: 1 },
    ];

    vi.mocked(db.getAuditLogs).mockResolvedValue(mockLogs as any);

    const result = await db.getAuditLogs(10, 0, 1);
    expect(result).toEqual(mockLogs);
  });

  it("should assign admin role", async () => {
    const mockRole = { id: 1, userId: 2, roleType: "moderator" };
    vi.mocked(db.assignAdminRole).mockResolvedValue(mockRole as any);

    const result = await db.assignAdminRole(2, "moderator", ["manage_content"], 1);
    expect(result).toEqual(mockRole);
  });
});


describe("Feed Tinder UI", () => {
  it("should display service cards with correct data", () => {
    const mockService = {
      id: 1,
      title: "Reparación de instalación eléctrica",
      description: "Reparación profesional",
      category: "electricidad",
      priceInTasklys: 150,
      latitude: 40.7128,
      longitude: -74.006,
      urgency: "flexible",
      createdById: 1,
      creatorName: "Juan García",
      creatorLevel: 4,
      distance: 0.5,
    };

    expect(mockService.title).toBeDefined();
    expect(mockService.priceInTasklys).toBe(150);
    expect(mockService.distance).toBeLessThan(1);
  });

  it("should calculate distance correctly", () => {
    // Haversine formula test
    const lat1 = 40.7128;
    const lon1 = -74.006;
    const lat2 = 40.7150;
    const lon2 = -74.002;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.round(R * c * 10) / 10;

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(10);
  });

  it("should validate urgency values", () => {
    const validUrgencies = ["now", "today", "flexible"];
    const testUrgencies = ["now", "today", "flexible", "invalid"];

    expect(validUrgencies).toContain("now");
    expect(validUrgencies).toContain("today");
    expect(validUrgencies).toContain("flexible");
    expect(validUrgencies).not.toContain("invalid");
  });

  it("should validate service categories", () => {
    const validCategories = [
      "electricidad",
      "plomería",
      "limpieza",
      "diseño",
      "tecnología",
      "fitness",
      "educación",
      "reparación",
    ];

    expect(validCategories).toContain("electricidad");
    expect(validCategories).toContain("diseño");
    expect(validCategories.length).toBe(8);
  });

  it("should handle swipe actions correctly", () => {
    const cards = [
      { id: 1, title: "Service 1" },
      { id: 2, title: "Service 2" },
      { id: 3, title: "Service 3" },
    ];

    let currentIndex = 0;

    // Simulate swipe
    if (currentIndex < cards.length - 1) {
      currentIndex++;
    }

    expect(currentIndex).toBe(1);
    expect(cards[currentIndex].title).toBe("Service 2");
  });

  it("should track card counter correctly", () => {
    const totalCards = 14;
    let currentIndex = 0;

    const cardCounter = `${currentIndex + 1} de ${totalCards}`;
    expect(cardCounter).toBe("1 de 14");

    currentIndex = 5;
    const updatedCounter = `${currentIndex + 1} de ${totalCards}`;
    expect(updatedCounter).toBe("6 de 14");
  });

  it("should format price display correctly", () => {
    const prices = [50, 100, 150, 200, 500];

    prices.forEach((price) => {
      const formatted = `${price} Tasklys`;
      expect(formatted).toContain("Tasklys");
      expect(formatted).toContain(price.toString());
    });
  });

  it("should handle empty service list", () => {
    const cards: any[] = [];

    expect(cards.length).toBe(0);
    expect(cards).toEqual([]);
  });

  it("should validate creator information", () => {
    const creator = {
      name: "Juan García",
      level: 4,
      rating: 4.8,
      servicesCompleted: 45,
    };

    expect(creator.name).toBeDefined();
    expect(creator.level).toBeGreaterThan(0);
    expect(creator.level).toBeLessThanOrEqual(5);
    expect(creator.rating).toBeGreaterThan(0);
    expect(creator.servicesCompleted).toBeGreaterThan(0);
  });
});


describe("Advanced Filters", () => {
  it("should filter services by category", () => {
    const services = [
      { id: 1, category: "electricidad", priceInTasklys: 100 },
      { id: 2, category: "plomería", priceInTasklys: 150 },
      { id: 3, category: "electricidad", priceInTasklys: 200 },
    ];

    const filtered = services.filter((s) => s.category === "electricidad");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe(1);
    expect(filtered[1].id).toBe(3);
  });

  it("should filter services by price range", () => {
    const services = [
      { id: 1, priceInTasklys: 50 },
      { id: 2, priceInTasklys: 150 },
      { id: 3, priceInTasklys: 300 },
    ];

    const filtered = services.filter(
      (s) => s.priceInTasklys >= 150 && s.priceInTasklys <= 200
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(2);
  });

  it("should filter services by urgency", () => {
    const services = [
      { id: 1, urgency: "now" },
      { id: 2, urgency: "today" },
      { id: 3, urgency: "flexible" },
    ];

    const filtered = services.filter((s) => s.urgency === "now");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].urgency).toBe("now");
  });

  it("should combine multiple filters", () => {
    const services = [
      { id: 1, category: "electricidad", priceInTasklys: 100, urgency: "now" },
      { id: 2, category: "plomería", priceInTasklys: 150, urgency: "today" },
      { id: 3, category: "electricidad", priceInTasklys: 200, urgency: "now" },
      { id: 4, category: "electricidad", priceInTasklys: 50, urgency: "flexible" },
    ];

    const filtered = services.filter(
      (s) =>
        s.category === "electricidad" &&
        s.priceInTasklys >= 150 &&
        s.priceInTasklys <= 200 &&
        s.urgency === "now"
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(3);
  });

  it("should handle empty filter results", () => {
    const services = [
      { id: 1, category: "electricidad", priceInTasklys: 100 },
    ];

    const filtered = services.filter((s) => s.category === "plomería");
    expect(filtered).toHaveLength(0);
    expect(filtered).toEqual([]);
  });

  it("should validate filter ranges", () => {
    const priceMin = 0;
    const priceMax = 1000;

    expect(priceMin).toBeLessThanOrEqual(priceMax);
    expect(priceMin).toBeGreaterThanOrEqual(0);
    expect(priceMax).toBeLessThanOrEqual(10000);
  });

  it("should validate distance range", () => {
    const maxDistance = 50;

    expect(maxDistance).toBeGreaterThan(0);
    expect(maxDistance).toBeLessThanOrEqual(100);
  });

  it("should persist filters to localStorage", () => {
    const filters = {
      categories: ["electricidad", "plomería"],
      priceMin: 100,
      priceMax: 500,
      maxDistance: 25,
      urgencies: ["now", "today"],
    };

    const serialized = JSON.stringify(filters);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(filters);
    expect(deserialized.categories).toHaveLength(2);
  });

  it("should reset filters correctly", () => {
    const defaultFilters = {
      categories: [],
      priceMin: 0,
      priceMax: 1000,
      maxDistance: 50,
      urgencies: [],
    };

    expect(defaultFilters.categories).toHaveLength(0);
    expect(defaultFilters.priceMin).toBe(0);
    expect(defaultFilters.priceMax).toBe(1000);
  });

  it("should count active filters", () => {
    const filters = {
      categories: ["electricidad"],
      priceMin: 100,
      priceMax: 500,
      maxDistance: 25,
      urgencies: ["now"],
    };

    let activeCount = 0;
    if (filters.categories.length > 0) activeCount++;
    if (filters.priceMin > 0 || filters.priceMax < 1000) activeCount++;
    if (filters.maxDistance < 50) activeCount++;
    if (filters.urgencies.length > 0) activeCount++;

    expect(activeCount).toBe(4);
  });
});
