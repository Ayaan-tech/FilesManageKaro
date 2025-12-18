import { S3Client } from '@aws-sdk/client-s3';

/**
 * Shared S3 configuration for all API routes
 * Requirements: 0.1, 0.2, 0.3
 */

// Region configuration
export const REGION = 'ap-south-1';

// Bucket name from centralized configuration
export const BUCKET_NAME = 'quarantine-upload-321351515';
export const BUCKET_NAME_PRODUCTION = 'production-store-56151';
// Shared S3 client instance configured with credentials from environment variables
export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
  },
  region: REGION,
});

// S3 configuration object for convenience
export const s3ConfigQuarantine = {
  client: s3Client,
  bucket: BUCKET_NAME,
  region: REGION,
};
export const s3ConfigProduction = {
  client: s3Client,
  bucket: BUCKET_NAME,
  region: REGION,
};
