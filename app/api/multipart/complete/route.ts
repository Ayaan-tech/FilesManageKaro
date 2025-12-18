import { NextRequest, NextResponse } from 'next/server';
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME, REGION } from '@/lib/s3-config';
import {
  invalidKeyError,
  invalidUploadIdError,
  invalidPartNumberError,
  invalidPartsError,
  invalidEtagError,
  missingPartsError,
  s3Error,
  isValidString,
  isValidPartNumber,
} from '@/lib/api-errors';

interface CompletedPart {
  partNumber: number;
  etag: string;
}

/**
 * POST /api/multipart/complete
 * Finalizes the multipart upload by assembling all parts
 * Requirements: 1.3, 5.1, 6.1, 6.2, 6.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, key, parts } = body;

    // Validate request parameters (Requirements: 5.1)
    if (!isValidString(uploadId)) {
      return invalidUploadIdError();
    }

    if (!isValidString(key)) {
      return invalidKeyError();
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      return invalidPartsError();
    }

    // Validate and sort parts
    const validatedParts: CompletedPart[] = [];
    for (const part of parts) {
      if (!isValidPartNumber(part.partNumber)) {
        return invalidPartNumberError();
      }
      if (!isValidString(part.etag)) {
        return invalidEtagError();
      }
      validatedParts.push({
        partNumber: part.partNumber,
        etag: part.etag,
      });
    }

    // Sort parts by part number
    validatedParts.sort((a, b) => a.partNumber - b.partNumber);

    // Verify all parts are present and in sequence (Requirements: 6.1, 6.2)
    const missingParts: number[] = [];
    for (let i = 0; i < validatedParts.length; i++) {
      const expectedPartNumber = i + 1;
      if (validatedParts[i].partNumber !== expectedPartNumber) {
        // Find all missing parts up to this point
        for (let j = expectedPartNumber; j < validatedParts[i].partNumber; j++) {
          missingParts.push(j);
        }
      }
    }

    if (missingParts.length > 0) {
      return missingPartsError(missingParts);
    }

    // Complete the multipart upload
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: validatedParts.map((part) => ({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })),
      },
    });

    const response = await s3Client.send(command);

    // Return final object details (Requirement: 6.3)
    return NextResponse.json({
      key: response.Key || key,
      etag: response.ETag || '',
      location: response.Location || `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    // Catch S3 errors and return structured responses (Requirements: 5.1, 5.4)
    console.error('Error completing multipart upload:', error);
    return s3Error(error);
  }
}
