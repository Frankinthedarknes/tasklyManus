// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}


// Media upload helpers for profile photos and videos
export async function uploadProfileMedia(
  userId: number,
  file: Buffer | Uint8Array | string,
  mediaType: "photo" | "video",
  fileName: string
): Promise<{ key: string; url: string }> {
  // Validate file type
  const mimeType = getMimeType(fileName, mediaType);
  validateMediaFile(fileName, mediaType);

  // Generate unique key with user ID and timestamp
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExt = fileName.split(".").pop() || "";
  const relKey = `users/${userId}/media/${mediaType}/${timestamp}-${randomSuffix}.${fileExt}`;

  // Upload to storage
  return await storagePut(relKey, file, mimeType);
}

function getMimeType(fileName: string, mediaType: "photo" | "video"): string {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (mediaType === "photo") {
    const photoMimes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    return photoMimes[ext] || "image/jpeg";
  } else {
    const videoMimes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
    };
    return videoMimes[ext] || "video/mp4";
  }
}

export function validateMediaFile(fileName: string, mediaType: "photo" | "video"): void {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (mediaType === "photo") {
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Invalid photo format. Allowed: ${allowedExts.join(", ")}`);
    }
  } else {
    const allowedExts = ["mp4", "webm", "mov", "avi", "mkv"];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Invalid video format. Allowed: ${allowedExts.join(", ")}`);
    }
  }
}

export function validateFileSize(
  size: number,
  mediaType: "photo" | "video"
): void {
  const maxPhotoSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  if (mediaType === "photo" && size > maxPhotoSize) {
    throw new Error(`Photo size exceeds 10MB limit. Got: ${(size / 1024 / 1024).toFixed(2)}MB`);
  }

  if (mediaType === "video" && size > maxVideoSize) {
    throw new Error(`Video size exceeds 50MB limit. Got: ${(size / 1024 / 1024).toFixed(2)}MB`);
  }
}
