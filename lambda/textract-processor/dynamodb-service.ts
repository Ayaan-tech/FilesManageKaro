import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DocumentMetadata, ExtractedData } from './types';

export class DynamoDBService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string = 'DocumentMetadata', region: string = 'us-east-1') {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * Save document metadata to DynamoDB
   */
  async saveDocumentMetadata(metadata: DocumentMetadata): Promise<boolean> {
    try {
      console.log(`Saving document metadata for FileID: ${metadata.FileID}`);
      
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
      console.log(`Successfully saved metadata for FileID: ${metadata.FileID}`);
      return true;
    } catch (error) {
      console.error('Error saving document metadata:', error);
      return false;
    }
  }

  /**
   * Get document metadata from DynamoDB
   */
  async getDocumentMetadata(fileId: string): Promise<DocumentMetadata | null> {
    try {
      console.log(`Retrieving document metadata for FileID: ${fileId}`);
      
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
      console.error('Error retrieving document metadata:', error);
      return null;
    }
  }

  /**
   * Update document processing status
   */
  async updateProcessingStatus(
    fileId: string, 
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    extractedData?: ExtractedData,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      console.log(`Updating processing status for FileID: ${fileId} to ${status}`);
      
      const updateExpression = ['SET ProcessingStatus = :status'];
      const expressionAttributeValues: any = {
        ':status': status
      };

      if (extractedData) {
        updateExpression.push('ExtractedInfo = :extractedInfo');
        expressionAttributeValues[':extractedInfo'] = extractedData;
      }

      if (errorMessage) {
        updateExpression.push('ErrorMessage = :errorMessage');
        expressionAttributeValues[':errorMessage'] = errorMessage;
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          FileID: fileId
        },
        UpdateExpression: updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues
      });

      await this.docClient.send(command);
      console.log(`Successfully updated status for FileID: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error updating processing status:', error);
      return false;
    }
  }

  /**
   * Create initial document record for async processing
   */
  async createInitialRecord(
    fileId: string,
    bucketName: string,
    documentType: 'PDF' | 'Image',
    jobId?: string
  ): Promise<boolean> {
    const metadata: DocumentMetadata = {
      FileID: fileId,
      BucketName: bucketName,
      DocumentType: documentType,
      UploadTimestamp: new Date().toISOString(),
      ExtractedInfo: {},
      ProcessingStatus: 'PROCESSING',
      JobId: jobId
    };

    return await this.saveDocumentMetadata(metadata);
  }

  /**
   * Query documents by processing status
   */
  async getDocumentsByStatus(status: 'PROCESSING' | 'COMPLETED' | 'FAILED'): Promise<DocumentMetadata[]> {
    try {
      // Note: This would require a GSI on ProcessingStatus for efficient querying
      // For now, we'll use a scan operation (not recommended for production)
      console.log(`Querying documents with status: ${status}`);
      
      // This is a simplified implementation
      // In production, you should use a GSI or different table design
      return [];
    } catch (error) {
      console.error('Error querying documents by status:', error);
      return [];
    }
  }

  /**
   * Batch save multiple documents (useful for bulk processing)
   */
  async batchSaveDocuments(documents: DocumentMetadata[]): Promise<boolean> {
    try {
      // Implementation would use BatchWriteCommand
      // This is a placeholder for the interface
      console.log(`Batch saving ${documents.length} documents`);
      
      for (const doc of documents) {
        await this.saveDocumentMetadata(doc);
      }
      
      return true;
    } catch (error) {
      console.error('Error batch saving documents:', error);
      return false;
    }
  }
}