import {
  TextractClient,
  AnalyzeExpenseCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  FeatureType,
  DocumentLocation,
  JobStatus
} from '@aws-sdk/client-textract';
import { ExtractedData, ProcessingResult, TextractJobResult } from './types';

export class TextractService {
  private textractClient: TextractClient;

  constructor(region: string = 'us-east-1') {
    this.textractClient = new TextractClient({ region });
  }

  /**
   * Process document based on file type
   */
  async processDocument(bucketName: string, s3Key: string): Promise<ProcessingResult> {
    try {
      const fileExtension = this.getFileExtension(s3Key);
      
      if (this.isImageFile(fileExtension)) {
        return await this.processImageDocument(bucketName, s3Key);
      } else if (this.isPdfFile(fileExtension)) {
        return await this.processPdfDocument(bucketName, s3Key);
      } else {
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}`
        };
      }
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  /**
   * Process image files (JPG/PNG) using synchronous AnalyzeExpense
   */
  private async processImageDocument(bucketName: string, s3Key: string): Promise<ProcessingResult> {
    try {
      console.log(`Processing image document: ${s3Key}`);
      
      const command = new AnalyzeExpenseCommand({
        Document: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        }
      });

      const response = await this.textractClient.send(command);
      const extractedData = this.extractExpenseData(response);

      return {
        success: true,
        data: extractedData
      };
    } catch (error) {
      console.error('Error processing image document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image processing failed'
      };
    }
  }

  /**
   * Process PDF files using asynchronous StartDocumentAnalysis
   */
  private async processPdfDocument(bucketName: string, s3Key: string): Promise<ProcessingResult> {
    try {
      console.log(`Starting PDF document analysis: ${s3Key}`);
      
      const command = new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key
          }
        },
        FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES]
      });

      const response = await this.textractClient.send(command);
      
      if (!response.JobId) {
        throw new Error('Failed to start document analysis job');
      }

      console.log(`Started PDF analysis job: ${response.JobId}`);
      
      // For Lambda, we'll return the job ID and handle polling separately
      // In a production environment, you might use Step Functions or SQS for polling
      return {
        success: true,
        jobId: response.JobId
      };
    } catch (error) {
      console.error('Error starting PDF document analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF processing failed'
      };
    }
  }

  /**
   * Poll for PDF document analysis completion
   */
  async pollDocumentAnalysis(jobId: string, maxAttempts: number = 30): Promise<TextractJobResult> {
    try {
      console.log(`Polling document analysis job: ${jobId}`);
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const command = new GetDocumentAnalysisCommand({ JobId: jobId });
        const response = await this.textractClient.send(command);
        
        const status = response.JobStatus as JobStatus;
        console.log(`Job ${jobId} status: ${status} (attempt ${attempt + 1})`);
        
        if (status === JobStatus.SUCCEEDED) {
          const extractedData = this.extractDocumentData(response);
          return {
            jobId,
            status: 'SUCCEEDED',
            extractedData
          };
        } else if (status === JobStatus.FAILED) {
          return {
            jobId,
            status: 'FAILED'
          };
        }
        
        // Wait 2 seconds before next poll
        await this.sleep(2000);
      }
      
      return {
        jobId,
        status: 'IN_PROGRESS'
      };
    } catch (error) {
      console.error('Error polling document analysis:', error);
      return {
        jobId,
        status: 'FAILED'
      };
    }
  }

  /**
   * Extract data from AnalyzeExpense response
   */
  private extractExpenseData(response: any): ExtractedData {
    const extractedData: ExtractedData = {};
    
    if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
      const expenseDoc = response.ExpenseDocuments[0];
      
      if (expenseDoc.SummaryFields) {
        for (const field of expenseDoc.SummaryFields) {
          const fieldType = field.Type?.Text?.toUpperCase();
          const fieldValue = field.ValueDetection?.Text;
          const confidence = field.ValueDetection?.Confidence || 0;
          
          switch (fieldType) {
            case 'VENDOR_NAME':
              extractedData.vendor = fieldValue;
              break;
            case 'TOTAL':
              extractedData.total = fieldValue;
              break;
            case 'INVOICE_RECEIPT_DATE':
              extractedData.date = fieldValue;
              break;
            case 'VENDOR_ADDRESS':
              extractedData.address = fieldValue;
              break;
          }
          
          // Store the highest confidence score
          if (confidence > (extractedData.confidence || 0)) {
            extractedData.confidence = confidence;
          }
        }
      }
    }
    
    console.log('Extracted expense data:', extractedData);
    return extractedData;
  }

  /**
   * Extract data from GetDocumentAnalysis response
   */
  private extractDocumentData(response: any): ExtractedData {
    const extractedData: ExtractedData = {};
    
    // For PDF documents, we'll extract key-value pairs from forms
    if (response.Blocks) {
      const keyValuePairs = this.extractKeyValuePairs(response.Blocks);
      
      // Map common field names to our standard format
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const lowerKey = key.toLowerCase();
        
        if (lowerKey.includes('vendor') || lowerKey.includes('company')) {
          extractedData.vendor = value as string;
        } else if (lowerKey.includes('total') || lowerKey.includes('amount')) {
          extractedData.total = value as string;
        } else if (lowerKey.includes('date')) {
          extractedData.date = value as string;
        } else if (lowerKey.includes('address')) {
          extractedData.address = value as string;
        }
      }
    }
    
    console.log('Extracted document data:', extractedData);
    return extractedData;
  }

  /**
   * Extract key-value pairs from Textract blocks
   */
  private extractKeyValuePairs(blocks: any[]): Record<string, string> {
    const keyValuePairs: Record<string, string> = {};
    const keyMap: Record<string, any> = {};
    const valueMap: Record<string, any> = {};
    
    // First pass: build maps of keys and values
    for (const block of blocks) {
      if (block.BlockType === 'KEY_VALUE_SET') {
        if (block.EntityTypes?.includes('KEY')) {
          keyMap[block.Id] = block;
        } else if (block.EntityTypes?.includes('VALUE')) {
          valueMap[block.Id] = block;
        }
      }
    }
    
    // Second pass: match keys with values
    for (const [keyId, keyBlock] of Object.entries(keyMap)) {
      if (keyBlock.Relationships) {
        for (const relationship of keyBlock.Relationships) {
          if (relationship.Type === 'VALUE') {
            for (const valueId of relationship.Ids) {
              const valueBlock = valueMap[valueId];
              if (valueBlock) {
                const keyText = this.getBlockText(keyBlock, blocks);
                const valueText = this.getBlockText(valueBlock, blocks);
                if (keyText && valueText) {
                  keyValuePairs[keyText] = valueText;
                }
              }
            }
          }
        }
      }
    }
    
    return keyValuePairs;
  }

  /**
   * Get text content from a block
   */
  private getBlockText(block: any, allBlocks: any[]): string {
    let text = '';
    
    if (block.Relationships) {
      for (const relationship of block.Relationships) {
        if (relationship.Type === 'CHILD') {
          for (const childId of relationship.Ids) {
            const childBlock = allBlocks.find(b => b.Id === childId);
            if (childBlock && childBlock.BlockType === 'WORD') {
              text += (text ? ' ' : '') + childBlock.Text;
            }
          }
        }
      }
    }
    
    return text.trim();
  }

  /**
   * Utility methods
   */
  private getFileExtension(s3Key: string): string {
    return s3Key.split('.').pop()?.toLowerCase() || '';
  }

  private isImageFile(extension: string): boolean {
    return ['jpg', 'jpeg', 'png'].includes(extension);
  }

  private isPdfFile(extension: string): boolean {
    return extension === 'pdf';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}