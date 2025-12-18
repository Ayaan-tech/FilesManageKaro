import { NextRequest, NextResponse } from 'next/server';
import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/s3-config';
import {
  invalidKeyError,
  invalidUploadIdError,
  invalidPartNumberError,
  s3Error,
  isValidString,
  isValidPartNumber,
} from '@/lib/api-errors';

// Presigned URL expiry time in seconds (1 hour)
const PRESIGNED_URL_EXPIRES_IN = 3600;

/**
 * POST /api/multipart/sign-part
 * Generates a presigned URL for uploading a specific part
 * Requirements: 1.2, 1.4, 5.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, key, partNumber } = body;

    // Validate request parameters (Requirements: 5.1)
    if (!isValidString(uploadId)) {
      return invalidUploadIdError();
    }

    if (!isValidString(key)) {
      return invalidKeyError();
    }

    // Validate part number is within S3's allowed range (1-10000)
    if (!isValidPartNumber(partNumber)) {
      return invalidPartNumberError();
    }

    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    return NextResponse.json({
      url,
      partNumber,
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    // Catch S3 errors and return structured responses (Requirements: 5.1, 5.4)
    console.error('Error generating presigned URL for part:', error);
    return s3Error(error);
  }
}
