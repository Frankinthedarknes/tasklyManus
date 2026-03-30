/**
 * useS3Upload Hook
 * Handles file uploads to S3 with validation and progress tracking
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseS3UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (url: string, key: string) => void;
  onError?: (error: Error) => void;
}

export function useS3Upload(options?: UseS3UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const validateUpload = trpc.userMedia.getUploadUrl.useMutation();

  const uploadFile = useCallback(
    async (
      file: File,
      mediaType: "photo" | "video"
    ): Promise<{ url: string; key: string } | null> => {
      try {
        setIsUploading(true);
        setProgress({ loaded: 0, total: file.size, percentage: 0 });

        // Validate file on backend
        const validation = await validateUpload.mutateAsync({
          type: mediaType,
          fileName: file.name,
          fileSize: file.size,
        });

        if (!validation.success) {
          throw new Error("File validation failed");
        }

        // Read file as buffer
        const buffer = await file.arrayBuffer();

        // Simulate upload progress (in real scenario, this would be from XMLHttpRequest)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newPercentage = Math.min(prev.percentage + 10, 90);
            const newLoaded = (newPercentage / 100) * prev.total;
            return {
              loaded: newLoaded,
              total: prev.total,
              percentage: newPercentage,
            };
          });
        }, 200);

        // Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);

        // Upload to storage endpoint
        // In production, this would use presigned URLs or direct S3 upload
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const result = await uploadResponse.json();

        // Complete progress
        setProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });

        options?.onProgress?.(progress);
        options?.onSuccess?.(result.url, result.key);

        toast.success(`${mediaType === "photo" ? "Foto" : "Video"} subido exitosamente`);

        return { url: result.url, key: result.key };
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        toast.error(err.message);
        options?.onError?.(err);
        return null;
      } finally {
        setIsUploading(false);
        setProgress({ loaded: 0, total: 0, percentage: 0 });
      }
    },
    [validateUpload, options]
  );

  return {
    uploadFile,
    isUploading,
    progress,
  };
}
