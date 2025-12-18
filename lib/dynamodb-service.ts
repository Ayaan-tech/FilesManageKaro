import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { EnhancedDocumentMetadata, DocumentAnalysis } from './types/document-types';

// Legacy interface for backward compatibility
export interface ExtractedData {
  vendor?: string;
  total?: string;
  date?: string;
  confidence?: number;
}

// Legacy interface for backward compatibility
export interface DocumentMetadata {
  FileID: string;
  BucketName: string;
  DocumentType: 'PDF' | 'Image';
  UploadTimestamp: string;
  ExtractedInfo: ExtractedData;
  ProcessingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  UserId: string;
  DocumentId: string;
  ErrorMessage?: string;
}

export class DynamoDBService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string = 'DocumentMetadata', region: string = 'ap-south-1') {
    const client = new DynamoDBClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
      }
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * Save enhanced document metadata to DynamoDB
   */
  async saveEnhancedMetadata(metadata: EnhancedDocumentMetadata): Promise<boolean> {
    try {
      console.log(`[DynamoDB] Saving enhanced metadata for FileID: ${metadata.FileID}`);
      
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...metadata,
          UploadTimestamp: metadata.UploadTimestamp || new Date().toISOString(),
          TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
        }
      });

      await this.docClient.send(command);
      console.log(`[DynamoDB] Successfully saved enhanced metadata for FileID: ${metadata.FileID}`);
      return true;
    } catch (error) {
      console.error('[DynamoDB] Error saving enhanced metadata:', error);
      return false;
    }
  }

  /**
   * Save document metadata to DynamoDB (legacy method)
   */
  async saveDocumentMetadata(metadata: DocumentMetadata): Promise<boolean> {
    try {
      console.log(`[DynamoDB] Saving document metadata for FileID: ${metadata.FileID}`);
      
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...metadata,
          // Ensure timestamp is in ISO format
          UploadTimestamp: metadata.UploadTimestamp || new Date().toISOString(),
          // Add TTL (optional - expires after 1 year)
          TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
        }
      });

      await this.docClient.send(command);
      console.log(`[DynamoDB] Successfully saved metadata for FileID: ${metadata.FileID}`);
      return true;
    } catch (error) {
      console.error('[DynamoDB] Error saving document metadata:', error);
      return false;
    }
  }

  /**
   * Get enhanced document metadata from DynamoDB
   */
  async getEnhancedMetadata(fileId: string): Promise<EnhancedDocumentMetadata | null> {
    try {
      console.log(`[DynamoDB] Retrieving enhanced metadata for FileID: ${fileId}`);
      
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          FileID: fileId
        }
      });

      const response = await this.docClient.send(command);
      
      if (response.Item) {
        return response.Item as EnhancedDocumentMetadata;
      }
      
      return null;
    } catch (error) {
      console.error('[DynamoDB] Error retrieving enhanced metadata:', error);
      return null;
    }
  }

  /**
   * Get document metadata from DynamoDB (legacy method)
   */
  async getDocumentMetadata(fileId: string): Promise<DocumentMetadata | null> {
    try {
      console.log(`[DynamoDB] Retrieving document metadata for FileID: ${fileId}`);
      
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          FileID: fileId
        }
      });

      const response = await this.docClient.send(command);
      
      if (response.Item) {
        return response.Item as DocumentMetadata;
      }
      
      return null;
    } catch (error) {
      console.error('[DynamoDB] Error retrieving document metadata:', error);
      return null;
    }
  }

  /**
   * Get all enhanced documents for a specific user
   */
  async getUserEnhancedDocuments(userId: string): Promise<EnhancedDocumentMetadata[]> {
    try {
      console.log(`[DynamoDB] Retrieving enhanced documents for user: ${userId}`);
      
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'UserId = :userId AND attribute_exists(Analysis)',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });

      const response = await this.docClient.send(command);
      
      console.log(`[DynamoDB] Enhanced scan returned ${response.Items?.length || 0} items`);
      
      if (response.Items) {
        return response.Items as EnhancedDocumentMetadata[];
      }
      
      return [];
    } catch (error) {
      console.error('[DynamoDB] Error retrieving enhanced user documents:', error);
      return [];
    }
  }

  /**
   * Get all documents for a specific user (legacy method)
   */
  async getUserDocuments(userId: string): Promise<DocumentMetadata[]> {
    try {
      console.log(`[DynamoDB] Retrieving legacy documents for user: ${userId}`);
      
      // Since we don't have a GSI on UserId, we'll use scan with filter
      // In production, you should create a GSI on UserId for better performance
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'UserId = :userId AND attribute_not_exists(Analysis)',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });

      const response = await this.docClient.send(command);
      
      console.log(`[DynamoDB] Legacy scan returned ${response.Items?.length || 0} items`);
      
      if (response.Items) {
        return response.Items as DocumentMetadata[];
      }
      
      return [];
    } catch (error) {
      console.error('[DynamoDB] Error retrieving user documents:', error);
      return [];
    }
  }

  /**
   * Create document record with extracted data
   */
  async createDocumentRecord(
    fileId: string,
    bucketName: string,
    documentType: 'PDF' | 'Image',
    userId: string,
    documentId: string,
    extractedData: ExtractedData
  ): Promise<boolean> {
    const metadata: DocumentMetadata = {
      FileID: fileId,
      BucketName: bucketName,
      DocumentType: documentType,
      UploadTimestamp: new Date().toISOString(),
      ExtractedInfo: extractedData,
      ProcessingStatus: 'COMPLETED',
      UserId: userId,
      DocumentId: documentId
    };

    return await this.saveDocumentMetadata(metadata);
  }

  /**
   * Update processing status
   */
  async updateProcessingStatus(
    fileId: string, 
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    extractedData?: ExtractedData,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      console.log(`[DynamoDB] Updating processing status for FileID: ${fileId} to ${status}`);
      
      // For simplicity, we'll get the existing item and update it
      const existingItem = await this.getDocumentMetadata(fileId);
      
      if (existingItem) {
        existingItem.ProcessingStatus = status;
        if (extractedData) {
          existingItem.ExtractedInfo = extractedData;
        }
        if (errorMessage) {
          existingItem.ErrorMessage = errorMessage;
        }
        
        return await this.saveDocumentMetadata(existingItem);
      }
      
      return false;
    } catch (error) {
      console.error('[DynamoDB] Error updating processing status:', error);
      return false;
    }
  }

  /**
   * Check if table exists and create if needed (for development)
   */
  async ensureTableExists(): Promise<boolean> {
    try {
      // This is a simplified check - in production, use CloudFormation/CDK
      console.log(`[DynamoDB] Checking if table ${this.tableName} exists`);
      
      // Try to get an item to test table existence
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { FileID: 'test-key-that-does-not-exist' }
      });
      
      await this.docClient.send(command);
      console.log(`[DynamoDB] Table ${this.tableName} exists`);
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.error(`[DynamoDB] Table ${this.tableName} does not exist. Please create it first.`);
        return false;
      }
      console.error('[DynamoDB] Error checking table existence:', error);
      return false;
    }
  }
}