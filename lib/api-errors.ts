import { NextResponse } from 'next/server';

/**
 * Structured API error response interface
 * Requirements: 5.1
 */
export interface ApiError {
  error: string;
  code: string;
  details?: string | number[];
  retryable: boolean;
}

/**
 * Error codes used across multipart upload API routes
 */
export const ErrorCodes = {
  INVALID_KEY: 'INVALID_KEY',
  INVALID_UPLOAD_ID: 'INVALID_UPLOAD_ID',
  INVALID_PART_NUMBER: 'INVALID_PART_NUMBER',
  INVALID_PARTS: 'INVALID_PARTS',
  INVALID_ETAG: 'INVALID_ETAG',
  MISSING_PARTS: 'MISSING_PARTS',
  UPLOAD_NOT_FOUND: 'UPLOAD_NOT_FOUND',
  S3_ERROR: 'S3_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Creates a structured error response
 */
export function createErrorResponse(
  error: string,
  code: ErrorCode,
  status: number,
  options?: { details?: string | number[]; retryable?: boolean }
): NextResponse<ApiError> {
  const response: ApiError = {
    error,
    code,
    retryable: options?.retryable ?? false,
  };

  if (options?.details !== undefined) {
    response.details = options.details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Helper for invalid key errors
 */
export function invalidKeyError(): NextResponse<ApiError> {
  return createErrorResponse('Key is required', ErrorCodes.INVALID_KEY, 400);
}

/**
 * Helper for invalid upload ID errors
 */
export function invalidUploadIdError(): NextResponse<ApiError> {
  return createErrorResponse('Invalid upload ID', ErrorCodes.INVALID_UPLOAD_ID, 400);
}


/**
 * Helper for invalid part number errors
 */
export function invalidPartNumberError(): NextResponse<ApiError> {
  return createErrorResponse(
    'Part number must be an integer between 1 and 10000',
    ErrorCodes.INVALID_PART_NUMBER,
    400
  );
}

/**
 * Helper for invalid parts array errors
 */
export function invalidPartsError(message?: string): NextResponse<ApiError> {
  return createErrorResponse(
    message || 'Parts array is required and must not be empty',
    ErrorCodes.INVALID_PARTS,
    400
  );
}

/**
 * Helper for invalid ETag errors
 */
export function invalidEtagError(): NextResponse<ApiError> {
  return createErrorResponse('Invalid ETag in parts array', ErrorCodes.INVALID_ETAG, 400);
}

/**
 * Helper for missing parts errors
 * Requirements: 6.2
 */
export function missingPartsError(missingParts: number[]): NextResponse<ApiError> {
  return createErrorResponse('Missing parts in sequence', ErrorCodes.MISSING_PARTS, 400, {
    details: missingParts,
  });
}

/**
 * Helper for upload not found errors
 */
export function uploadNotFoundError(): NextResponse<ApiError> {
  return createErrorResponse('Upload not found', ErrorCodes.UPLOAD_NOT_FOUND, 404);
}

/**
 * Helper for S3 operation errors
 * Requirements: 5.1, 5.4
 */
export function s3Error(error: unknown): NextResponse<ApiError> {
  const details = error instanceof Error ? error.message : 'Unknown error';
  return createErrorResponse('S3 operation failed', ErrorCodes.S3_ERROR, 500, {
    details,
    retryable: true,
  });
}

/**
 * Helper for generic S3 errors with custom message
 */
export function s3ErrorWithMessage(message: string): NextResponse<ApiError> {
  return createErrorResponse(message, ErrorCodes.S3_ERROR, 500, {
    retryable: true,
  });
}

/**
 * Validates that a value is a non-empty string
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a part number is within S3's allowed range (1-10000)
 */
export function isValidPartNumber(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10000
  );
}
