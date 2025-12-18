import { S3Event, S3EventRecord, Context, Callback } from 'aws-lambda';
import { TextractService } from './textract-service';
import { DynamoDBService } from './dynamodb-service';
import { DocumentMetadata, ExtractedData, S3EventRecord as CustomS3EventRecord } from './types';

// Environment variables
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'DocumentMetadata';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize services
const textractService = new TextractService(AWS_REGION);
const dynamoDBService = new DynamoDBService(DYNAMODB_TABLE, AWS_REGION);

/**
 * Main Lambda handler for S3 ObjectCreated events
 */
export const handler = async (
  event: S3Event,
  context: Context,
  callback: Callback
): Promise<void> => {
  console.log('Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Process each S3 record in the event
    const results = await Promise.allSettled(
      event.Records.map(record => processS3Record(record))
    );
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Record ${index} processed successfully:`, result.value);
      } else {
        console.error(`Record ${index} failed:`, result.reason);
      }
    });
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Processing complete: ${successCount} succeeded, ${failureCount} failed`);
    
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing complete',
        processed: successCount,
        failed: failureCount
      })
    });
    
  } catch (error) {
    console.error('Lambda handler error:', error);
    callback(error);
  }
};

/**
 * Process individual S3 record
 */
async function processS3Record(record: S3EventRecord): Promise<string> {
  const bucketName = record.s3.bucket.name;
  const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing file: ${s3Key} from bucket: ${bucketName}`);
  
  try {
    // Determine document type
    const documentType = getDocumentType(s3Key);
    
    if (!documentType) {
      throw new Error(`Unsupported file type for: ${s3Key}`);
    }
    
    // Create initial record in DynamoDB
    await dynamoDBService.createInitialRecord(s3Key, bucketName, documentType);
    
    // Process the document
    const processingResult = await textractService.processDocument(bucketName, s3Key);
    
    if (!processingResult.success) {
      // Update status to failed
      await dynamoDBService.updateProcessingStatus(
        s3Key,
        'FAILED',
        undefined,
        processingResult.error
      );
      throw new Error(processingResult.error);
    }
    
    // Handle different processing outcomes
    if (processingResult.jobId) {
      // PDF processing - job started, will be completed asynchronously
      console.log(`PDF processing job started: ${processingResult.jobId}`);
      
      // For demonstration, we'll poll immediately (in production, use Step Functions or SQS)
      const jobResult = await textractService.pollDocumentAnalysis(processingResult.jobId);
      
      if (jobResult.status === 'SUCCEEDED' && jobResult.extractedData) {
        await dynamoDBService.updateProcessingStatus(
          s3Key,
          'COMPLETED',
          jobResult.extractedData
        );
      } else if (jobResult.status === 'FAILED') {
        await dynamoDBService.updateProcessingStatus(
          s3Key,
          'FAILED',
          undefined,
          'PDF processing job failed'
        );
      } else {
        // Still in progress - in production, this would be handled by a separate polling mechanism
        console.log(`PDF processing still in progress for job: ${processingResult.jobId}`);
      }
      
      return `PDF processing initiated for ${s3Key}`;
      
    } else if (processingResult.data) {
      // Image processing - completed synchronously
      await dynamoDBService.updateProcessingStatus(
        s3Key,
        'COMPLETED',
        processingResult.data
      );
      
      return `Image processing completed for ${s3Key}`;
    }
    
    throw new Error('Unexpected processing result');
    
  } catch (error) {
    console.error(`Error processing ${s3Key}:`, error);
    
    // Update status to failed
    await dynamoDBService.updateProcessingStatus(
      s3Key,
      'FAILED',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    throw error;
  }
}

/**
 * Determine document type from file extension
 */
function getDocumentType(s3Key: string): 'PDF' | 'Image' | null {
  const extension = s3Key.split('.').pop()?.toLowerCase();
  
  if (!extension) return null;
  
  if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return 'Image';
  } else if (extension === 'pdf') {
    return 'PDF';
  }
  
  return null;
}

/**
 * Separate handler for polling PDF jobs (can be triggered by CloudWatch Events)
 */
export const pollPdfJobsHandler = async (
  event: any,
  context: Context,
  callback: Callback
): Promise<void> => {
  console.log('PDF polling handler started');
  
  try {
    // In a real implementation, you would:
    // 1. Query DynamoDB for documents with status 'PROCESSING' and JobId
    // 2. Poll each job using TextractService.pollDocumentAnalysis
    // 3. Update the status based on results
    
    const processingDocs = await dynamoDBService.getDocumentsByStatus('PROCESSING');
    
    for (const doc of processingDocs) {
      if (doc.JobId) {
        console.log(`Polling job: ${doc.JobId} for document: ${doc.FileID}`);
        
        const jobResult = await textractService.pollDocumentAnalysis(doc.JobId, 1); // Single poll
        
        if (jobResult.status === 'SUCCEEDED' && jobResult.extractedData) {
          await dynamoDBService.updateProcessingStatus(
            doc.FileID,
            'COMPLETED',
            jobResult.extractedData
          );
        } else if (jobResult.status === 'FAILED') {
          await dynamoDBService.updateProcessingStatus(
            doc.FileID,
            'FAILED',
            undefined,
            'PDF processing job failed'
          );
        }
        // If still in progress, leave as is for next poll
      }
    }
    
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'PDF polling complete' })
    });
    
  } catch (error) {
    console.error('PDF polling handler error:', error);
    callback(error);
  }
};

/**
 * Health check handler
 */
export const healthCheckHandler = async (
  event: any,
  context: Context,
  callback: Callback
): Promise<void> => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Textract processor is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  });
};