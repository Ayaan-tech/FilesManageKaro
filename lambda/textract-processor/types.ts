// Type definitions for Textract document processing

export interface ExtractedData {
  vendor?: string;
  total?: string;
  date?: string;
  address?: string;
  confidence?: number;
}

export interface DocumentMetadata {
  FileID: string; // S3 Key (Partition Key)
  BucketName: string;
  DocumentType: 'PDF' | 'Image';
  UploadTimestamp: string;
  ExtractedInfo: ExtractedData;
  ProcessingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  JobId?: string; // For async PDF processing
  ErrorMessage?: string;
}

export interface S3EventRecord {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
    };
  };
}

export interface TextractJobResult {
  jobId: string;
  status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  extractedData?: ExtractedData;
}

export interface ProcessingResult {
  success: boolean;
  data?: ExtractedData;
  error?: string;
  jobId?: string;
}