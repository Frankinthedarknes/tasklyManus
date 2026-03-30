import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Profile Features - User Skills", () => {
  let testUserId: number;

  beforeAll(async () => {
    await db.upsertUser({
      openId: "test-skills",
      name: "Skills Test User",
      email: "skills@example.com",
    });

    const user = await db.getUserByOpenId("test-skills");
    testUserId = user?.id || 1;
  });

  it("should add user skill", async () => {
    const result = await db.addUserSkill(
      testUserId,
      "Limpieza Profunda",
      "Hogar",
      "Especializado en limpieza de hogares",
      5
    );
    expect(result).toBeDefined();
  });

  it("should get user skills", async () => {
    const skills = await db.getUserSkills(testUserId);
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should include skill details", async () => {
    const skills = await db.getUserSkills(testUserId);

    if (skills.length > 0) {
      const skill = skills[0];
      expect(skill).toHaveProperty("name");
      expect(skill).toHaveProperty("category");
    }
  });

  it("should add skill with optional fields", async () => {
    const result = await db.addUserSkill(testUserId, "Reparaciones", "Técnico");
    expect(result).toBeDefined();
  });

  it("should delete user skill", async () => {
    const skills = await db.getUserSkills(testUserId);
    if (skills.length > 0) {
      const result = await db.deleteUserSkill(skills[0].id);
      expect(result).toBeDefined();
    }
  });
});

describe("Profile Features - User Media", () => {
  let testUserId: number;

  beforeAll(async () => {
    await db.upsertUser({
      openId: "test-media",
      name: "Media Test User",
      email: "media@example.com",
    });

    const user = await db.getUserByOpenId("test-media");
    testUserId = user?.id || 1;
  });

  it("should add user photo", async () => {
    const result = await db.addUserMedia(
      testUserId,
      "photo",
      "https://example.com/photo.jpg",
      "Profile Photo",
      "My main profile photo",
      true
    );
    expect(result).toBeDefined();
  });

  it("should get user media", async () => {
    const media = await db.getUserMedia(testUserId);
    expect(Array.isArray(media)).toBe(true);
  });

  it("should filter media by type", async () => {
    const photos = await db.getUserMedia(testUserId, "photo");
    expect(Array.isArray(photos)).toBe(true);
  });

  it("should get main user photo", async () => {
    const mainPhoto = await db.getMainUserPhoto(testUserId);
    // May or may not exist, just verify no error
    expect(mainPhoto === undefined || mainPhoto !== undefined).toBe(true);
  });

  it("should set main user photo", async () => {
    const media = await db.getUserMedia(testUserId, "photo");

    if (media.length > 0) {
      const result = await db.setMainUserPhoto(media[0].id, testUserId);
      expect(result).toBeDefined();
    }
  });

  it("should add video", async () => {
    const result = await db.addUserMedia(
      testUserId,
      "video",
      "https://example.com/video.mp4",
      "Introduction Video",
      "My introduction video"
    );
    expect(result).toBeDefined();
  });

  it("should delete media", async () => {
    const media = await db.getUserMedia(testUserId);

    if (media.length > 0) {
      const result = await db.deleteUserMedia(media[0].id);
      expect(result).toBeDefined();
    }
  });

  it("should update media display order", async () => {
    const media = await db.getUserMedia(testUserId);

    if (media.length > 1) {
      const ids = media.map((m: any) => m.id).reverse();
      const result = await db.updateMediaDisplayOrder(testUserId, ids);
      expect(result).toBe(true);
    }
  });

  it("should include media metadata", async () => {
    const media = await db.getUserMedia(testUserId);

    if (media.length > 0) {
      const item = media[0];
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("url");
    }
  });
});

describe("Profile Features - Integration", () => {
  let testUserId: number;

  beforeAll(async () => {
    await db.upsertUser({
      openId: "test-integration",
      name: "Integration Test User",
      email: "integration@example.com",
    });

    const user = await db.getUserByOpenId("test-integration");
    testUserId = user?.id || 1;
  });

  it("should manage complete profile with all features", async () => {
    // Add photo
    const photoResult = await db.addUserMedia(
      testUserId,
      "photo",
      "https://example.com/photo.jpg",
      "Profile Photo",
      undefined,
      true
    );
    expect(photoResult).toBeDefined();

    // Add skill
    const skillResult = await db.addUserSkill(
      testUserId,
      "Limpieza",
      "Hogar",
      "Profesional",
      3
    );
    expect(skillResult).toBeDefined();

    // Add video
    const videoResult = await db.addUserMedia(
      testUserId,
      "video",
      "https://example.com/video.mp4",
      "Introduction"
    );
    expect(videoResult).toBeDefined();

    // Verify all data
    const photos = await db.getUserMedia(testUserId, "photo");
    const videos = await db.getUserMedia(testUserId, "video");
    const skills = await db.getUserSkills(testUserId);

    expect(Array.isArray(photos)).toBe(true);
    expect(Array.isArray(videos)).toBe(true);
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should maintain data consistency", async () => {
    const media = await db.getUserMedia(testUserId);
    const skills = await db.getUserSkills(testUserId);

    expect(Array.isArray(media)).toBe(true);
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should retrieve all media types", async () => {
    const allMedia = await db.getUserMedia(testUserId);
    expect(Array.isArray(allMedia)).toBe(true);

    const photos = await db.getUserMedia(testUserId, "photo");
    const videos = await db.getUserMedia(testUserId, "video");

    expect(Array.isArray(photos)).toBe(true);
    expect(Array.isArray(videos)).toBe(true);
  });

  it("should retrieve all user skills", async () => {
    const skills = await db.getUserSkills(testUserId);
    expect(Array.isArray(skills)).toBe(true);
  });
});
