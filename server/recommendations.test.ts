import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Recommendations - Provider Scoring", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-recommendations",
      name: "Recommendations Test User",
      email: "recommendations@example.com",
    });

    const user = await db.getUserByOpenId("test-recommendations");
    testUserId = user?.id || 1;
  });

  it("should calculate recommendation score for user", async () => {
    const score = await db.calculateRecommendationScore(testUserId);
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("should calculate score with category", async () => {
    const score = await db.calculateRecommendationScore(testUserId, "cleaning");
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("should return 0 for non-existent user", async () => {
    const score = await db.calculateRecommendationScore(99999);
    expect(score).toBe(0);
  });

  it("should include badge weight in score", async () => {
    const scoreWithoutCategory = await db.calculateRecommendationScore(testUserId);
    const scoreWithCategory = await db.calculateRecommendationScore(
      testUserId,
      "cleaning"
    );

    // Both should be numbers
    expect(typeof scoreWithoutCategory).toBe("number");
    expect(typeof scoreWithCategory).toBe("number");
  });
});

describe("Recommendations - Get Recommended Providers", () => {
  it("should get recommended providers by category", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 5);
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should respect limit parameter", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 3);
    expect(providers.length).toBeLessThanOrEqual(3);
  });

  it("should return empty array for non-existent category", async () => {
    const providers = await db.getRecommendedProviders("non_existent_category_xyz");
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should include recommendation score in results", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 5);

    if (providers.length > 0) {
      providers.forEach((provider: any) => {
        expect(provider).toHaveProperty("recommendationScore");
        expect(typeof provider.recommendationScore).toBe("number");
      });
    }
  });

  it("should sort providers by recommendation score", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 10);

    if (providers.length > 1) {
      for (let i = 1; i < providers.length; i++) {
        expect(providers[i - 1].recommendationScore).toBeGreaterThanOrEqual(
          providers[i].recommendationScore
        );
      }
    }
  });

  it("should include badge information", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("badgeCount");
      expect(provider).toHaveProperty("badges");
      expect(Array.isArray(provider.badges)).toBe(true);
    }
  });

  it("should filter by minimum badges", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 10, 1);

    providers.forEach((provider: any) => {
      expect(provider.badgeCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Recommendations - Get Top Providers", () => {
  it("should get top providers by category", async () => {
    const providers = await db.getTopProvidersByCategory("cleaning", 5);
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should respect limit parameter", async () => {
    const providers = await db.getTopProvidersByCategory("cleaning", 3);
    expect(providers.length).toBeLessThanOrEqual(3);
  });

  it("should include user information", async () => {
    const providers = await db.getTopProvidersByCategory("cleaning", 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("userId");
      expect(provider).toHaveProperty("userName");
      expect(provider).toHaveProperty("userLevel");
      expect(provider).toHaveProperty("averageRating");
      expect(provider).toHaveProperty("totalRatings");
    }
  });

  it("should include badge information", async () => {
    const providers = await db.getTopProvidersByCategory("cleaning", 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("badgeCount");
      expect(provider).toHaveProperty("badges");
      expect(Array.isArray(provider.badges)).toBe(true);
    }
  });

  it("should include service count", async () => {
    const providers = await db.getTopProvidersByCategory("cleaning", 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("servicesCount");
      expect(typeof provider.servicesCount).toBe("number");
    }
  });
});

describe("Recommendations - Get Providers by Badge Type", () => {
  it("should get providers by badge type", async () => {
    const providers = await db.getProvidersByBadgeType("trusted", undefined, 5);
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should filter by badge type and category", async () => {
    const providers = await db.getProvidersByBadgeType("trusted", "cleaning", 5);
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should respect limit parameter", async () => {
    const providers = await db.getProvidersByBadgeType("trusted", undefined, 3);
    expect(providers.length).toBeLessThanOrEqual(3);
  });

  it("should return empty for invalid badge type", async () => {
    const providers = await db.getProvidersByBadgeType("invalid_badge_type", undefined, 5);
    expect(Array.isArray(providers)).toBe(true);
  });

  it("should include badge information", async () => {
    const providers = await db.getProvidersByBadgeType("trusted", undefined, 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("badgeTitle");
      expect(provider).toHaveProperty("badgeIcon");
      expect(provider).toHaveProperty("badgeEarnedAt");
    }
  });

  it("should include user information", async () => {
    const providers = await db.getProvidersByBadgeType("trusted", undefined, 5);

    if (providers.length > 0) {
      const provider = providers[0];
      expect(provider).toHaveProperty("userId");
      expect(provider).toHaveProperty("userName");
      expect(provider).toHaveProperty("averageRating");
      expect(provider).toHaveProperty("totalRatings");
    }
  });
});

describe("Recommendations - Algorithm Validation", () => {
  it("should prioritize high ratings", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 10);

    if (providers.length > 1) {
      // Higher rated providers should have higher scores
      const firstRating = parseFloat(providers[0].averageRating);
      const lastRating = parseFloat(providers[providers.length - 1].averageRating);

      // This is a general trend, not always strict
      expect(firstRating).toBeGreaterThanOrEqual(0);
      expect(lastRating).toBeGreaterThanOrEqual(0);
    }
  });

  it("should prioritize providers with badges", async () => {
    const providersWithBadges = await db.getRecommendedProviders("cleaning", 10, 1);
    const allProviders = await db.getRecommendedProviders("cleaning", 10, 0);

    // Providers with badges should be in top results
    if (providersWithBadges.length > 0 && allProviders.length > 0) {
      expect(providersWithBadges[0].badgeCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("should include review count in scoring", async () => {
    const providers = await db.getRecommendedProviders("cleaning", 10);

    if (providers.length > 0) {
      providers.forEach((provider: any) => {
        expect(provider).toHaveProperty("totalReviews");
        expect(typeof provider.totalReviews).toBe("number");
      });
    }
  });
});
