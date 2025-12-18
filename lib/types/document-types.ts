// Enhanced document type definitions

export enum DocumentType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  MEDICAL = 'medical',
  LEGAL = 'legal',
  GENERAL = 'general',
  REPORT = 'report',
  UNKNOWN = 'unknown'
}

export interface InvoiceData {
  vendor?: string;
  total?: string;
  date?: string;
  invoiceNumber?: string;
  taxAmount?: string;
}

export interface ContractData {
  parties?: string[];
  effectiveDate?: string;
  expirationDate?: string;
  keyTerms?: string[];
  contractType?: string;
}

export interface MedicalData {
  patientName?: string;
  testType?: string;
  results?: string[];
  recommendations?: string[];
  doctorName?: string;
  testDate?: string;
}

export interface GeneralData {
  title?: string;
  summary?: string;
  keyPoints?: string[];
  documentLength?: number;
  language?: string;
  category?: string;
}

export interface BedrockSummary {
  keyPoints: string[];
  riskFactors?: string[];
  actionItems?: string[];
  simplifiedExplanation: string;
  confidence: number;
  language: 'simple' | 'technical';
}

export interface DocumentAnalysis {
  documentType: DocumentType;
  confidence: number;
  
  // Type-specific data
  invoice?: InvoiceData;
  contract?: ContractData;
  medical?: MedicalData;
  general?: GeneralData;
  
  // AI Summary
  bedrockSummary?: BedrockSummary;
  
  // Raw text content
  fullText?: string;
  
  // Processing metadata
  processingTime?: number;
  textractApi?: string;
  bedrockModel?: string;
}

export interface EnhancedDocumentMetadata {
  FileID: string;
  BucketName: string;
  DocumentType: DocumentType;
  UploadTimestamp: string;
  ProcessingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  UserId: string;
  DocumentId: string;
  
  // Enhanced analysis data
  Analysis: DocumentAnalysis;
  
  // Legacy fields for backward compatibility
  ExtractedInfo?: {
    vendor?: string;
    total?: string;
    date?: string;
    confidence?: number;
  };
  
  ErrorMessage?: string;
  TTL?: number;
}