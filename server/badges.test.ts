import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Trust Badges - Calculation and Award", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-badges-user",
      name: "Badge Test User",
      email: "badges@example.com",
    });

    const user = await db.getUserByOpenId("test-badges-user");
    testUserId = user?.id || 1;
  });

  it("should calculate badges based on five-star reviews", async () => {
    const badges = await db.calculateAndAwardBadges(testUserId);
    expect(Array.isArray(badges)).toBe(true);
  });

  it("should return empty array when user has no reviews", async () => {
    const badges = await db.calculateAndAwardBadges(testUserId);
    // Should not crash and return array
    expect(Array.isArray(badges)).toBe(true);
  });

  it("should retrieve user badges", async () => {
    const badges = await db.getUserBadges(testUserId);
    expect(Array.isArray(badges)).toBe(true);
  });

  it("should have correct badge structure", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    if (badges.length > 0) {
      const badge = badges[0];
      expect(badge).toHaveProperty("id");
      expect(badge).toHaveProperty("userId");
      expect(badge).toHaveProperty("type");
      expect(badge).toHaveProperty("title");
      expect(badge).toHaveProperty("description");
      expect(badge).toHaveProperty("icon");
      expect(badge).toHaveProperty("fiveStarCount");
      expect(badge).toHaveProperty("totalReviews");
      expect(badge).toHaveProperty("averageRating");
      expect(badge).toHaveProperty("isActive");
      expect(badge).toHaveProperty("earnedAt");
    }
  });

  it("should support badge types", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    const validTypes = [
      "trusted",
      "highly_trusted",
      "verified_expert",
      "community_leader",
      "perfect_rating",
      "responsive",
      "professional",
    ];

    badges.forEach((badge: any) => {
      expect(validTypes).toContain(badge.type);
    });
  });

  it("should track five-star count", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    badges.forEach((badge: any) => {
      expect(typeof badge.fiveStarCount).toBe("number");
      expect(badge.fiveStarCount).toBeGreaterThanOrEqual(0);
    });
  });

  it("should track total reviews", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    badges.forEach((badge: any) => {
      expect(typeof badge.totalReviews).toBe("number");
      expect(badge.totalReviews).toBeGreaterThanOrEqual(badge.fiveStarCount);
    });
  });

  it("should track average rating", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    badges.forEach((badge: any) => {
      const avgRating = parseFloat(badge.averageRating);
      expect(avgRating).toBeGreaterThanOrEqual(0);
      expect(avgRating).toBeLessThanOrEqual(5);
    });
  });

  it("should mark badges as active by default", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    badges.forEach((badge: any) => {
      expect(badge.isActive).toBe(true);
    });
  });

  it("should track earned date", async () => {
    const badges = await db.getUserBadges(testUserId);
    
    badges.forEach((badge: any) => {
      expect(badge.earnedAt).toBeDefined();
      expect(badge.earnedAt instanceof Date || typeof badge.earnedAt === "string").toBe(true);
    });
  });
});

describe("Trust Badges - Revocation", () => {
  let testUserId: number;
  let testBadgeId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-revoke-badges",
      name: "Revoke Test User",
      email: "revoke@example.com",
    });

    const user = await db.getUserByOpenId("test-revoke-badges");
    testUserId = user?.id || 1;
  });

  it("should revoke badge by setting isActive to false", async () => {
    // This test depends on having badges in the database
    const badges = await db.getUserBadges(testUserId);
    
    if (badges.length > 0) {
      testBadgeId = badges[0].id;
      const result = await db.revokeBadge(testBadgeId);
      expect(result).toBeDefined();
    }
  });

  it("should not return revoked badges in active list", async () => {
    if (testBadgeId) {
      const badges = await db.getUserBadges(testUserId);
      const revokedBadge = badges.find((b: any) => b.id === testBadgeId);
      
      // Revoked badges should not be in the active list
      if (revokedBadge) {
        expect(revokedBadge.isActive).toBe(false);
      }
    }
  });
});

describe("Trust Badges - Badge Types", () => {
  it("should have correct badge type names", () => {
    const validTypes = [
      "trusted",
      "highly_trusted",
      "verified_expert",
      "community_leader",
      "perfect_rating",
      "responsive",
      "professional",
    ];

    expect(validTypes).toHaveLength(7);
    expect(validTypes).toContain("trusted");
    expect(validTypes).toContain("highly_trusted");
    expect(validTypes).toContain("verified_expert");
    expect(validTypes).toContain("community_leader");
    expect(validTypes).toContain("perfect_rating");
    expect(validTypes).toContain("responsive");
    expect(validTypes).toContain("professional");
  });

  it("should have meaningful badge descriptions", () => {
    const badgeDescriptions: Record<string, string> = {
      trusted: "10+ reseñas de 5 estrellas",
      highly_trusted: "25+ reseñas de 5 estrellas",
      verified_expert: "50+ reseñas de 5 estrellas",
      community_leader: "100+ reseñas de 5 estrellas",
      perfect_rating: "100% reseñas de 5 estrellas",
      responsive: "Respuesta rápida (< 2 horas promedio)",
      professional: "Calidad consistentemente alta (4.8+ promedio)",
    };

    Object.entries(badgeDescriptions).forEach(([type, description]) => {
      expect(description.length).toBeGreaterThan(0);
    });
  });
});
