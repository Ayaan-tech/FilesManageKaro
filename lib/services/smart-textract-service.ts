import { 
  TextractClient, 
  AnalyzeExpenseCommand, 
  DetectDocumentTextCommand,
  AnalyzeDocumentCommand,
  FeatureType 
} from '@aws-sdk/client-textract';
import { DocumentType, DocumentAnalysis, InvoiceData, GeneralData } from '../types/document-types';

export class SmartTextractService {
  private textractClient: TextractClient;

  constructor(region: string = 'ap-south-1') {
    this.textractClient = new TextractClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
      },
      region,
    });
  }

  /**
   * Analyze document based on its detected type
   */
  async analyzeDocument(
    bucketName: string, 
    s3Key: string, 
    documentType: DocumentType
  ): Promise<DocumentAnalysis> {
    const startTime = Date.now();
    
    try {
      let analysis: DocumentAnalysis;
      
      switch (documentType) {
        case DocumentType.INVOICE:
          analysis = await this.analyzeInvoice(bucketName, s3Key);
          break;
          
        case DocumentType.CONTRACT:
        case DocumentType.LEGAL:
        case DocumentType.MEDICAL:
        case DocumentType.REPORT:
        case DocumentType.GENERAL:
        default:
          analysis = await this.analyzeGeneralDocument(bucketName, s3Key);
          break;
      }
      
      analysis.processingTime = Date.now() - startTime;
      analysis.documentType = documentType;
      
      return analysis;
      
    } catch (error) {
      console.error('[SmartTextract] Error analyzing document:', error);
      throw error;
    }
  }

  /**
   * Analyze invoice/receipt using AnalyzeExpense
   */
  private async analyzeInvoice(bucketName: string, s3Key: string): Promise<DocumentAnalysis> {
    console.log('[SmartTextract] Analyzing invoice with AnalyzeExpense');
    
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Key
        }
      }
    });

    const response = await this.textractClient.send(command);
    
    // Extract invoice data
    const invoiceData: InvoiceData = {};
    let confidence = 0;
    let confidenceCount = 0;

    if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
      const expenseDoc = response.ExpenseDocuments[0];
      
      if (expenseDoc.SummaryFields) {
        for (const field of expenseDoc.SummaryFields) {
          const fieldType = field.Type?.Text?.toUpperCase();
          const fieldValue = field.ValueDetection?.Text;
          const fieldConfidence = field.ValueDetection?.Confidence || 0;
          
          if (fieldValue) {
            switch (fieldType) {
              case 'VENDOR_NAME':
                invoiceData.vendor = fieldValue;
                break;
              case 'TOTAL':
                invoiceData.total = fieldValue;
                break;
              case 'INVOICE_RECEIPT_DATE':
                invoiceData.date = fieldValue;
                break;
              case 'INVOICE_RECEIPT_ID':
                invoiceData.invoiceNumber = fieldValue;
                break;
              case 'TAX':
                invoiceData.taxAmount = fieldValue;
                break;
            }
            
            confidence += fieldConfidence;
            confidenceCount++;
          }
        }
      }
    }

    return {
      documentType: DocumentType.INVOICE,
      confidence: confidenceCount > 0 ? confidence / confidenceCount : 0,
      invoice: invoiceData,
      textractApi: 'AnalyzeExpenseCommand'
    };
  }

  /**
   * Analyze general document using DetectDocumentText
   */
  private async analyzeGeneralDocument(bucketName: string, s3Key: string): Promise<DocumentAnalysis> {
    console.log('[SmartTextract] Analyzing general document with DetectDocumentText');
    
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Key
        }
      }
    });

    const response = await this.textractClient.send(command);
    
    // Extract full text
    let fullText = '';
    let confidence = 0;
    let confidenceCount = 0;

    if (response.Blocks) {
      const textBlocks = response.Blocks.filter(block => 
        block.BlockType === 'LINE' && block.Text
      );
      
      fullText = textBlocks
        .map(block => block.Text)
        .join('\n');
      
      // Calculate average confidence
      textBlocks.forEach(block => {
        if (block.Confidence) {
          confidence += block.Confidence;
          confidenceCount++;
        }
      });
    }

    // Generate basic analysis
    const generalData: GeneralData = {
      title: this.extractTitle(fullText),
      summary: this.generateBasicSummary(fullText),
      keyPoints: this.extractKeyPoints(fullText),
      documentLength: fullText.split(' ').length,
      language: 'English', // Could be enhanced with language detection
      category: 'Text Document'
    };

    return {
      documentType: DocumentType.GENERAL,
      confidence: confidenceCount > 0 ? confidence / confidenceCount : 0,
      general: generalData,
      fullText: fullText,
      textractApi: 'DetectDocumentTextCommand'
    };
  }

  /**
   * Extract title from document text
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return 'Untitled Document';
    
    // Use first non-empty line as title, limit length
    const title = lines[0].trim();
    return title.length > 100 ? title.substring(0, 100) + '...' : title;
  }

  /**
   * Generate basic summary from text
   */
  private generateBasicSummary(text: string): string {
    const words = text.split(' ').filter(word => word.trim());
    const wordCount = words.length;
    
    if (wordCount === 0) {
      return 'Empty document';
    } else if (wordCount < 50) {
      return 'Short document with basic content';
    } else if (wordCount < 200) {
      return 'Medium-length document with detailed information';
    } else {
      return 'Comprehensive document with extensive content';
    }
  }

  /**
   * Extract key points from text (basic implementation)
   */
  private extractKeyPoints(text: string): string[] {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.length < 200);
    
    // Take first few meaningful lines as key points
    return lines.slice(0, 5).map(line => 
      line.length > 100 ? line.substring(0, 100) + '...' : line
    );
  }

  /**
   * Analyze document with tables (for reports)
   */
  private async analyzeDocumentWithTables(bucketName: string, s3Key: string): Promise<DocumentAnalysis> {
    console.log('[SmartTextract] Analyzing document with tables');
    
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Key
        }
      },
      FeatureTypes: [FeatureType.TABLES, FeatureType.FORMS]
    });

    const response = await this.textractClient.send(command);
    
    // This would be enhanced to extract table data and form fields
    // For now, fall back to general document analysis
    return this.analyzeGeneralDocument(bucketName, s3Key);
  }
}