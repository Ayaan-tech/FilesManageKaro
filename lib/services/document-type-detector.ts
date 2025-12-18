import { DocumentType } from '../types/document-types';

export class DocumentTypeDetector {
  
  /**
   * Detect document type based on filename and content
   */
  detectType(fileName: string, content?: string): DocumentType {
    const lowerFileName = fileName.toLowerCase();
    const lowerContent = content?.toLowerCase() || '';
    
    // Rule-based detection using filename patterns
    const filenameType = this.detectFromFilename(lowerFileName);
    if (filenameType !== DocumentType.UNKNOWN) {
      return filenameType;
    }
    
    // Content-based detection if available
    if (content) {
      return this.detectFromContent(lowerContent);
    }
    
    return DocumentType.GENERAL;
  }
  
  /**
   * Detect type from filename patterns
   */
  private detectFromFilename(fileName: string): DocumentType {
    const patterns = {
      [DocumentType.INVOICE]: [
        'invoice', 'receipt', 'bill', 'payment', 'purchase',
        'transaction', 'expense', 'cost', 'charge'
      ],
      [DocumentType.CONTRACT]: [
        'contract', 'agreement', 'terms', 'conditions',
        'lease', 'rental', 'employment', 'service'
      ],
      [DocumentType.MEDICAL]: [
        'medical', 'health', 'patient', 'doctor', 'hospital',
        'lab', 'test', 'result', 'prescription', 'diagnosis'
      ],
      [DocumentType.LEGAL]: [
        'legal', 'court', 'lawsuit', 'litigation', 'attorney',
        'lawyer', 'judgment', 'settlement', 'claim'
      ],
      [DocumentType.REPORT]: [
        'report', 'analysis', 'summary', 'findings',
        'research', 'study', 'evaluation', 'assessment'
      ]
    };
    
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return type as DocumentType;
      }
    }
    
    return DocumentType.UNKNOWN;
  }
  
  /**
   * Detect type from document content
   */
  private detectFromContent(content: string): DocumentType {
    const contentPatterns = {
      [DocumentType.INVOICE]: [
        'total', 'amount', 'tax', 'subtotal', 'invoice',
        'receipt', 'payment', 'due', 'vendor', 'customer'
      ],
      [DocumentType.CONTRACT]: [
        'agreement', 'party', 'parties', 'terms', 'conditions',
        'effective date', 'termination', 'breach', 'obligations'
      ],
      [DocumentType.MEDICAL]: [
        'patient', 'doctor', 'physician', 'diagnosis', 'treatment',
        'medication', 'symptoms', 'test results', 'blood', 'pressure'
      ],
      [DocumentType.LEGAL]: [
        'court', 'judge', 'plaintiff', 'defendant', 'lawsuit',
        'legal', 'attorney', 'counsel', 'jurisdiction', 'statute'
      ],
      [DocumentType.REPORT]: [
        'executive summary', 'findings', 'conclusions', 'recommendations',
        'methodology', 'analysis', 'data', 'results', 'observations'
      ]
    };
    
    const scores: Record<DocumentType, number> = {
      [DocumentType.INVOICE]: 0,
      [DocumentType.CONTRACT]: 0,
      [DocumentType.MEDICAL]: 0,
      [DocumentType.LEGAL]: 0,
      [DocumentType.REPORT]: 0,
      [DocumentType.GENERAL]: 0,
      [DocumentType.UNKNOWN]: 0
    };
    
    // Score each type based on keyword matches
    for (const [type, keywords] of Object.entries(contentPatterns)) {
      const typeKey = type as DocumentType;
      scores[typeKey] = keywords.reduce((score, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        return score + matches;
      }, 0);
    }
    
    // Find the type with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return DocumentType.GENERAL;
    }
    
    const detectedType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    return (detectedType as DocumentType) || DocumentType.GENERAL;
  }
  
  /**
   * Get confidence score for detection
   */
  getConfidence(fileName: string, content?: string): number {
    const filenameType = this.detectFromFilename(fileName.toLowerCase());
    const contentType = content ? this.detectFromContent(content.toLowerCase()) : null;
    
    if (filenameType !== DocumentType.UNKNOWN && contentType && filenameType === contentType) {
      return 0.95; // High confidence - both filename and content agree
    } else if (filenameType !== DocumentType.UNKNOWN) {
      return 0.75; // Medium confidence - filename match only
    } else if (contentType) {
      return 0.60; // Lower confidence - content match only
    }
    
    return 0.30; // Low confidence - fallback to general
  }
  
  /**
   * Get appropriate description for document type
   */
  getTypeDescription(type: DocumentType): string {
    const descriptions = {
      [DocumentType.INVOICE]: 'Invoice or Receipt',
      [DocumentType.CONTRACT]: 'Contract or Agreement',
      [DocumentType.MEDICAL]: 'Medical Document',
      [DocumentType.LEGAL]: 'Legal Document',
      [DocumentType.REPORT]: 'Report or Analysis',
      [DocumentType.GENERAL]: 'General Document',
      [DocumentType.UNKNOWN]: 'Unknown Document Type'
    };
    
    return descriptions[type];
  }
}