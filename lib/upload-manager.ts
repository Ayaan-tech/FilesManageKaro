/**
 * Upload Manager - Client-side multipart upload orchestration
 * Requirements: 7.1, 7.2, 7.3, 7.4, 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 5.2, 5.4
 */

// Default configuration
const DEFAULT_PART_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_CONCURRENT_PARTS = 5;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 2;

// Interfaces
export interface UploadOptions {
  partSize?: number;
  maxConcurrentParts?: number;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: UploadError) => void;
  onComplete?: (result: UploadResult) => void;
}

export interface UploadProgress {
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  currentPart: number;
  totalParts: number;
}

export interface UploadResult {
  key: string;
  etag: string;
  location: string;
}

export interface UploadError {
  code: string;
  message: string;
  partNumber?: number;
  retryable: boolean;
}

interface CompletedPart {
  partNumber: number;
  etag: string;
}

interface InitResponse {
  uploadId: string;
  key: string;
  partSize: number;
}

interface SignPartResponse {
  url: string;
  partNumber: number;
  expiresIn: number;
}

interface CompleteResponse {
  key: string;
  etag: string;
  location: string;
}


interface ApiError {
  error: string;
  code: string;
  details?: string | number[];
  retryable: boolean;
}

/**
 * UploadManager class - Orchestrates multipart uploads to S3
 * Handles file chunking, parallel uploads, progress tracking, and retry logic
 */
export class UploadManager {
  private partSize: number;
  private maxConcurrentParts: number;
  private onProgress?: (progress: UploadProgress) => void;
  private onError?: (error: UploadError) => void;
  private onComplete?: (result: UploadResult) => void;

  // Upload state
  private uploadId: string | null = null;
  private key: string | null = null;
  private completedParts: CompletedPart[] = [];
  private uploadedBytes: number = 0;
  private totalBytes: number = 0;
  private totalParts: number = 0;
  private aborted: boolean = false;

  constructor(options?: UploadOptions) {
    this.partSize = options?.partSize ?? DEFAULT_PART_SIZE;
    this.maxConcurrentParts = options?.maxConcurrentParts ?? DEFAULT_MAX_CONCURRENT_PARTS;
    this.onProgress = options?.onProgress;
    this.onError = options?.onError;
    this.onComplete = options?.onComplete;
  }

  /**
   * Split file into chunks based on part size (Requirement 7.1)
   */
  private splitFileIntoParts(file: File): Blob[] {
    const parts: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + this.partSize, file.size);
      parts.push(file.slice(offset, end));
      offset = end;
    }

    return parts;
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private getRetryDelay(attempt: number): number {
    const delay = BASE_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt);
    return Math.min(delay, MAX_RETRY_DELAY);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize multipart upload (Requirement 1.1)
   */
  private async initUpload(key: string, contentType: string): Promise<InitResponse> {
    const response = await fetch('/api/multipart/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to initialize upload');
    }

    return response.json();
  }

  /**
   * Get presigned URL for a part (Requirement 1.2)
   */
  private async signPart(uploadId: string, key: string, partNumber: number): Promise<SignPartResponse> {
    const response = await fetch('/api/multipart/sign-part', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, key, partNumber }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    return response.json();
  }

  /**
   * Complete multipart upload (Requirement 1.3)
   */
  private async completeUpload(uploadId: string, key: string, parts: CompletedPart[]): Promise<CompleteResponse> {
    const response = await fetch('/api/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, key, parts }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to complete upload');
    }

    return response.json();
  }


  /**
   * Upload a single part with retry logic (Requirements 1.4, 5.4)
   */
  private async uploadPartWithRetry(
    partBlob: Blob,
    partNumber: number,
    uploadId: string,
    key: string
  ): Promise<CompletedPart> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (this.aborted) {
        throw new Error('Upload aborted');
      }

      try {
        // Get presigned URL
        const signResponse = await this.signPart(uploadId, key, partNumber);

        // Upload part directly to S3
        const uploadResponse = await fetch(signResponse.url, {
          method: 'PUT',
          body: partBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Part upload failed with status ${uploadResponse.status}`);
        }

        // Get ETag from response headers
        const etag = uploadResponse.headers.get('ETag');
        if (!etag) {
          throw new Error('No ETag returned from S3');
        }

        return {
          partNumber,
          etag: etag.replace(/"/g, ''), // Remove quotes from ETag
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // If not the last attempt, wait before retrying
        if (attempt < MAX_RETRIES - 1) {
          const delay = this.getRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const uploadError: UploadError = {
      code: 'PART_UPLOAD_FAILED',
      message: lastError?.message || 'Part upload failed after retries',
      partNumber,
      retryable: true,
    };
    this.onError?.(uploadError);
    throw lastError;
  }

  /**
   * Update and emit progress (Requirements 5.2, 7.2)
   */
  private updateProgress(partNumber: number, partBytes: number): void {
    this.uploadedBytes += partBytes;
    const percentage = this.totalBytes > 0 
      ? Math.round((this.uploadedBytes / this.totalBytes) * 100) 
      : 0;

    const progress: UploadProgress = {
      totalBytes: this.totalBytes,
      uploadedBytes: this.uploadedBytes,
      percentage,
      currentPart: partNumber,
      totalParts: this.totalParts,
    };

    this.onProgress?.(progress);
  }

  /**
   * Upload parts in parallel with concurrency limit (Requirements 3.1, 3.2, 3.3)
   */
  private async uploadPartsInParallel(
    parts: Blob[],
    uploadId: string,
    key: string
  ): Promise<CompletedPart[]> {
    const completedParts: CompletedPart[] = [];
    const partQueue = parts.map((blob, index) => ({ blob, partNumber: index + 1 }));
    const inProgress: Promise<void>[] = [];

    const uploadPart = async (blob: Blob, partNumber: number): Promise<void> => {
      const completedPart = await this.uploadPartWithRetry(blob, partNumber, uploadId, key);
      completedParts.push(completedPart);
      this.updateProgress(partNumber, blob.size);
    };

    // Process parts with concurrency limit
    for (const { blob, partNumber } of partQueue) {
      if (this.aborted) {
        throw new Error('Upload aborted');
      }

      // Wait if we've reached max concurrent uploads
      while (inProgress.length >= this.maxConcurrentParts) {
        await Promise.race(inProgress);
        // Remove completed promises
        for (let i = inProgress.length - 1; i >= 0; i--) {
          const promise = inProgress[i];
          const isSettled = await Promise.race([
            promise.then(() => true).catch(() => true),
            Promise.resolve(false),
          ]);
          if (isSettled) {
            inProgress.splice(i, 1);
          }
        }
      }

      const uploadPromise = uploadPart(blob, partNumber).finally(() => {
        const index = inProgress.indexOf(uploadPromise);
        if (index > -1) {
          inProgress.splice(index, 1);
        }
      });
      inProgress.push(uploadPromise);
    }

    // Wait for all remaining uploads to complete
    await Promise.all(inProgress);

    // Sort by part number for completion
    return completedParts.sort((a, b) => a.partNumber - b.partNumber);
  }


  /**
   * Main upload method - orchestrates the entire multipart upload process
   * Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4
   */
  async upload(file: File, key: string): Promise<UploadResult> {
    // Reset state
    this.aborted = false;
    this.completedParts = [];
    this.uploadedBytes = 0;
    this.totalBytes = file.size;
    this.uploadId = null;
    this.key = key;

    try {
      // Split file into parts (Requirement 7.1)
      const parts = this.splitFileIntoParts(file);
      this.totalParts = parts.length;

      // Initialize upload (Requirement 1.1)
      const initResponse = await this.initUpload(key, file.type || 'application/octet-stream');
      this.uploadId = initResponse.uploadId;

      // Emit initial progress
      this.onProgress?.({
        totalBytes: this.totalBytes,
        uploadedBytes: 0,
        percentage: 0,
        currentPart: 0,
        totalParts: this.totalParts,
      });

      // Upload parts in parallel (Requirements 1.2, 3.1, 3.2, 3.3)
      this.completedParts = await this.uploadPartsInParallel(parts, this.uploadId, key);

      // Complete upload (Requirement 1.3)
      const result = await this.completeUpload(this.uploadId, key, this.completedParts);

      // Emit completion (Requirement 7.3)
      const uploadResult: UploadResult = {
        key: result.key,
        etag: result.etag,
        location: result.location,
      };
      this.onComplete?.(uploadResult);

      return uploadResult;
    } catch (error) {
      // Emit error (Requirement 7.4)
      const uploadError: UploadError = {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Upload failed',
        retryable: true,
      };
      this.onError?.(uploadError);
      throw error;
    }
  }

  /**
   * Abort the current upload
   */
  async abort(): Promise<void> {
    this.aborted = true;
    // Note: In a full implementation, we would also call S3 AbortMultipartUpload
    // to clean up the incomplete upload on S3
  }

  /**
   * Get current upload progress (Requirement 5.2)
   */
  getProgress(): UploadProgress {
    const percentage = this.totalBytes > 0 
      ? Math.round((this.uploadedBytes / this.totalBytes) * 100) 
      : 0;

    return {
      totalBytes: this.totalBytes,
      uploadedBytes: this.uploadedBytes,
      percentage,
      currentPart: this.completedParts.length,
      totalParts: this.totalParts,
    };
  }
}
