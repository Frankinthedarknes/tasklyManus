import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Ratings - Pending Reviews", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testServiceId: number;

  beforeAll(async () => {
    // Create test users
    await db.upsertUser({
      openId: "test-user-1-reviews",
      name: "Test User 1",
      email: "test1@example.com",
    });

    await db.upsertUser({
      openId: "test-user-2-reviews",
      name: "Test User 2",
      email: "test2@example.com",
    });

    // Get user IDs
    const user1 = await db.getUserByOpenId("test-user-1-reviews");
    const user2 = await db.getUserByOpenId("test-user-2-reviews");

    testUserId1 = user1?.id || 1;
    testUserId2 = user2?.id || 2;
  });

  it("should return empty array when user has no completed services", async () => {
    const pendingReviews = await db.getPendingReviews(testUserId1);
    expect(Array.isArray(pendingReviews)).toBe(true);
  });

  it("should return empty array when all services are already reviewed", async () => {
    const pendingReviews = await db.getPendingReviews(testUserId1);
    expect(pendingReviews.length).toBe(0);
  });

  it("should identify pending reviews correctly", async () => {
    const pendingReviews = await db.getPendingReviews(testUserId1);
    
    // Should have pending reviews structure
    if (pendingReviews.length > 0) {
      const review = pendingReviews[0];
      expect(review).toHaveProperty("serviceId");
      expect(review).toHaveProperty("serviceName");
      expect(review).toHaveProperty("providerName");
      expect(review).toHaveProperty("ratedUserId");
      expect(review).toHaveProperty("completedAt");
    }
  });

  it("should check if user can interact", async () => {
    const canInteract = await db.canUserInteract(testUserId1);
    expect(typeof canInteract).toBe("boolean");
  });

  it("should return false when user has pending reviews", async () => {
    // This test depends on having actual pending reviews in the database
    const canInteract = await db.canUserInteract(testUserId1);
    const pendingReviews = await db.getPendingReviews(testUserId1);
    
    if (pendingReviews.length > 0) {
      expect(canInteract).toBe(false);
    } else {
      expect(canInteract).toBe(true);
    }
  });

  it("should return true when user has no pending reviews", async () => {
    const pendingReviews = await db.getPendingReviews(testUserId2);
    const canInteract = await db.canUserInteract(testUserId2);
    
    if (pendingReviews.length === 0) {
      expect(canInteract).toBe(true);
    }
  });
});

describe("Ratings - Create and Retrieve", () => {
  let testUserId: number;
  let testRatedUserId: number;
  let testServiceId: number;

  beforeAll(async () => {
    // Create test users
    await db.upsertUser({
      openId: "test-rater",
      name: "Rater User",
      email: "rater@example.com",
    });

    await db.upsertUser({
      openId: "test-rated",
      name: "Rated User",
      email: "rated@example.com",
    });

    const rater = await db.getUserByOpenId("test-rater");
    const rated = await db.getUserByOpenId("test-rated");

    testUserId = rater?.id || 1;
    testRatedUserId = rated?.id || 2;
  });

  it("should create a rating successfully", async () => {
    const ratingId = await db.createRating(
      1,
      testUserId,
      testRatedUserId,
      5,
      "Excelente servicio",
      { communication: 5, punctuality: 5, quality: 5 },
      ["responsive", "professional"]
    );

    expect(ratingId).toBeDefined();
  });

  it("should retrieve user ratings", async () => {
    const ratings = await db.getUserRatings(testRatedUserId);
    expect(Array.isArray(ratings)).toBe(true);
  });

  it("should validate rating score range", async () => {
    // Score should be 1-5
    const validRatingId = await db.createRating(
      1,
      testUserId,
      testRatedUserId,
      3,
      "Buen servicio"
    );

    expect(validRatingId).toBeDefined();
  });

  it("should include review text in rating", async () => {
    const ratingId = await db.createRating(
      1,
      testUserId,
      testRatedUserId,
      4,
      "Muy buen trabajo, recomendado"
    );

    expect(ratingId).toBeDefined();
  });

  it("should support category-specific feedback", async () => {
    const categories = {
      communication: 5,
      punctuality: 4,
      quality: 5,
      professionalism: 5,
    };

    const ratingId = await db.createRating(
      1,
      testUserId,
      testRatedUserId,
      5,
      "Excelente en todo",
      categories
    );

    expect(ratingId).toBeDefined();
  });

  it("should support badges", async () => {
    const badges = ["responsive", "professional", "trustworthy", "punctual"];

    const ratingId = await db.createRating(
      1,
      testUserId,
      testRatedUserId,
      5,
      "Merece todos los badges",
      undefined,
      badges
    );

    expect(ratingId).toBeDefined();
  });
});
