import { ExtractedData } from './types';

/**
 * Utility functions for data processing and validation
 */

/**
 * Clean and normalize extracted text data
 */
export function cleanExtractedData(data: ExtractedData): ExtractedData {
  const cleaned: ExtractedData = {};
  
  // Clean vendor name
  if (data.vendor) {
    cleaned.vendor = data.vendor
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s&.-]/g, '') // Remove special characters except common business ones
      .substring(0, 100); // Limit length
  }
  
  // Clean and validate total amount
  if (data.total) {
    const totalMatch = data.total.match(/[\d,]+\.?\d*/);
    if (totalMatch) {
      const numericValue = parseFloat(totalMatch[0].replace(/,/g, ''));
      if (!isNaN(numericValue) && numericValue >= 0) {
        cleaned.total = `$${numericValue.toFixed(2)}`;
      }
    }
  }
  
  // Clean and validate date
  if (data.date) {
    const cleanedDate = normalizeDate(data.date);
    if (cleanedDate) {
      cleaned.date = cleanedDate;
    }
  }
  
  // Clean address
  if (data.address) {
    cleaned.address = data.address
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 200); // Limit length
  }
  
  // Preserve confidence if available
  if (data.confidence !== undefined) {
    cleaned.confidence = Math.round(data.confidence * 100) / 100; // Round to 2 decimal places
  }
  
  return cleaned;
}

/**
 * Normalize date formats to ISO string
 */
export function normalizeDate(dateString: string): string | null {
  try {
    // Remove extra whitespace and common prefixes
    const cleaned = dateString.trim().replace(/^(date|invoice date|receipt date):\s*/i, '');
    
    // Try to parse various date formats
    const patterns = [
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // MM/DD/YYYY or MM-DD-YYYY
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/,  // MM/DD/YY or MM-DD-YY
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let year, month, day;
        
        if (pattern === patterns[0]) { // MM/DD/YYYY
          [, month, day, year] = match;
        } else if (pattern === patterns[1]) { // YYYY/MM/DD
          [, year, month, day] = match;
        } else if (pattern === patterns[2]) { // MM/DD/YY
          [, month, day, year] = match;
          year = parseInt(year) < 50 ? `20${year}` : `19${year}`; // Y2K handling
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      }
    }
    
    // Fallback: try direct Date parsing
    const fallbackDate = new Date(cleaned);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.warn('Date normalization failed:', error);
    return null;
  }
}

/**
 * Validate extracted data quality
 */
export function validateExtractedData(data: ExtractedData): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  // Check vendor
  if (data.vendor && data.vendor.length > 2) {
    score += 30;
  } else {
    issues.push('Vendor name missing or too short');
  }
  
  // Check total
  if (data.total && /^\$?\d+\.?\d*$/.test(data.total.replace(/,/g, ''))) {
    score += 40;
  } else {
    issues.push('Total amount missing or invalid format');
  }
  
  // Check date
  if (data.date) {
    const normalizedDate = normalizeDate(data.date);
    if (normalizedDate) {
      score += 20;
    } else {
      issues.push('Date format could not be normalized');
    }
  } else {
    issues.push('Date missing');
  }
  
  // Check confidence
  if (data.confidence && data.confidence > 80) {
    score += 10;
  } else if (data.confidence && data.confidence > 60) {
    score += 5;
  } else {
    issues.push('Low confidence in extracted data');
  }
  
  return {
    isValid: score >= 70, // Require at least 70% score
    score,
    issues
  };
}

/**
 * Generate a unique document ID
 */
export function generateDocumentId(s3Key: string, timestamp?: string): string {
  const cleanKey = s3Key.replace(/[^a-zA-Z0-9]/g, '_');
  const time = timestamp || new Date().toISOString().replace(/[^0-9]/g, '');
  return `doc_${cleanKey}_${time}`.substring(0, 100); // Limit length
}

/**
 * Extract file metadata from S3 key
 */
export function extractFileMetadata(s3Key: string): {
  fileName: string;
  fileExtension: string;
  filePath: string;
  isSupported: boolean;
} {
  const parts = s3Key.split('/');
  const fileName = parts[parts.length - 1];
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const filePath = parts.slice(0, -1).join('/');
  
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
  const isSupported = supportedExtensions.includes(fileExtension);
  
  return {
    fileName,
    fileExtension,
    filePath,
    isSupported
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: string | number, currency: string = 'USD'): string {
  try {
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]/g, ''))
      : amount;
    
    if (isNaN(numericAmount)) {
      return amount.toString();
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numericAmount);
  } catch (error) {
    return amount.toString();
  }
}

/**
 * Retry mechanism for async operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Log structured data for CloudWatch
 */
export function logStructured(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };
  
  console.log(JSON.stringify(logEntry));
}