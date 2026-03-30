import { describe, it, expect } from "vitest";
import { validateFileSize, validateMediaFile } from "./storage";

describe("S3 Upload - File Validation", () => {
  describe("validateMediaFile", () => {
    it("should accept valid photo formats", () => {
      expect(() => validateMediaFile("photo.jpg", "photo")).not.toThrow();
      expect(() => validateMediaFile("image.png", "photo")).not.toThrow();
      expect(() => validateMediaFile("picture.webp", "photo")).not.toThrow();
      expect(() => validateMediaFile("gif.gif", "photo")).not.toThrow();
    });

    it("should reject invalid photo formats", () => {
      expect(() => validateMediaFile("file.mp4", "photo")).toThrow();
      expect(() => validateMediaFile("document.pdf", "photo")).toThrow();
      expect(() => validateMediaFile("audio.mp3", "photo")).toThrow();
    });

    it("should accept valid video formats", () => {
      expect(() => validateMediaFile("video.mp4", "video")).not.toThrow();
      expect(() => validateMediaFile("movie.webm", "video")).not.toThrow();
      expect(() => validateMediaFile("clip.mov", "video")).not.toThrow();
      expect(() => validateMediaFile("file.avi", "video")).not.toThrow();
      expect(() => validateMediaFile("mkv.mkv", "video")).not.toThrow();
    });

    it("should reject invalid video formats", () => {
      expect(() => validateMediaFile("image.jpg", "video")).toThrow();
      expect(() => validateMediaFile("audio.mp3", "video")).toThrow();
      expect(() => validateMediaFile("document.pdf", "video")).toThrow();
    });

    it("should be case insensitive", () => {
      expect(() => validateMediaFile("PHOTO.JPG", "photo")).not.toThrow();
      expect(() => validateMediaFile("VIDEO.MP4", "video")).not.toThrow();
    });
  });

  describe("validateFileSize", () => {
    it("should accept photos under 5MB", () => {
      const size1MB = 1 * 1024 * 1024;
      const size5MB = 5 * 1024 * 1024;

      expect(() => validateFileSize(size1MB, "photo")).not.toThrow();
      expect(() => validateFileSize(size5MB, "photo")).not.toThrow();
    });

    it("should reject photos over 5MB", () => {
      const size6MB = 6 * 1024 * 1024;
      expect(() => validateFileSize(size6MB, "photo")).toThrow(
        /Photo size exceeds 5MB limit/
      );
    });

    it("should accept videos under 50MB", () => {
      const size10MB = 10 * 1024 * 1024;
      const size50MB = 50 * 1024 * 1024;

      expect(() => validateFileSize(size10MB, "video")).not.toThrow();
      expect(() => validateFileSize(size50MB, "video")).not.toThrow();
    });

    it("should reject videos over 50MB", () => {
      const size51MB = 51 * 1024 * 1024;
      expect(() => validateFileSize(size51MB, "video")).toThrow(
        /Video size exceeds 50MB limit/
      );
    });

    it("should provide helpful error messages", () => {
      const size10MB = 10 * 1024 * 1024;
      try {
        validateFileSize(size10MB, "photo");
      } catch (error) {
        expect((error as Error).message).toContain("10.00MB");
      }
    });
  });

  describe("Combined validation", () => {
    it("should validate photo correctly", () => {
      expect(() => {
        validateMediaFile("photo.jpg", "photo");
        validateFileSize(2 * 1024 * 1024, "photo");
      }).not.toThrow();
    });

    it("should validate video correctly", () => {
      expect(() => {
        validateMediaFile("video.mp4", "video");
        validateFileSize(30 * 1024 * 1024, "video");
      }).not.toThrow();
    });

    it("should fail on invalid format", () => {
      expect(() => {
        validateMediaFile("file.txt", "photo");
      }).toThrow();
    });

    it("should fail on oversized file", () => {
      expect(() => {
        validateMediaFile("video.mp4", "video");
        validateFileSize(100 * 1024 * 1024, "video");
      }).toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle files with no extension", () => {
      expect(() => validateMediaFile("photo", "photo")).toThrow();
    });

    it("should handle files with multiple dots", () => {
      expect(() => validateMediaFile("my.photo.backup.jpg", "photo")).not.toThrow();
    });

    it("should handle zero-byte files", () => {
      expect(() => validateFileSize(0, "photo")).not.toThrow();
    });

    it("should handle very large file sizes", () => {
      const size1GB = 1024 * 1024 * 1024;
      expect(() => validateFileSize(size1GB, "video")).toThrow();
    });
  });
});
