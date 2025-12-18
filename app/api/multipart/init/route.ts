import { NextRequest, NextResponse } from 'next/server';
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '@/lib/s3-config';
import {
  invalidKeyError,
  s3Error,
  s3ErrorWithMessage,
  isValidString,
} from '@/lib/api-errors';

// Default part size: 5MB
const DEFAULT_PART_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/multipart/init
 * Creates a new multipart upload session
 * Requirements: 1.1, 5.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, contentType } = body;

    // Validate request parameters (Requirements: 5.1)
    if (!isValidString(key)) {
      return invalidKeyError();
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const response = await s3Client.send(command);

    if (!response.UploadId) {
      return s3ErrorWithMessage('Failed to create multipart upload');
    }

    return NextResponse.json({
      uploadId: response.UploadId,
      key: key,
      partSize: DEFAULT_PART_SIZE,
    });
  } catch (error) {
    // Catch S3 errors and return structured responses (Requirements: 5.1, 5.4)
    console.error('Error creating multipart upload:', error);
    return s3Error(error);
  }
}
