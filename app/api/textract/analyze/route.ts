import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";
import { DocumentTypeDetector } from "@/lib/services/document-type-detector";
import { SmartTextractService } from "@/lib/services/smart-textract-service";
import { BedrockService } from "@/lib/services/bedrock-service";
import { DocumentType, EnhancedDocumentMetadata } from "@/lib/types/document-types";

const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
const documentTypeDetector = new DocumentTypeDetector();
const smartTextractService = new SmartTextractService(process.env.AWS_REGION || 'ap-south-1');
const bedrockService = new BedrockService('us-east-1'); // Bedrock is typically in us-east-1

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { s3Key } = await request.json();
        
        if (!s3Key) {
            return NextResponse.json({ 
                error: "S3 key is required" 
            }, { status: 400 });
        }

        console.log('[Textract Analyze] Processing document:', s3Key);

        // Extract filename from S3 key
        const fileName = s3Key.split('/').pop() || s3Key;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        
        // Step 1: Detect document type
        const documentType = documentTypeDetector.detectType(fileName);
        const typeConfidence = documentTypeDetector.getConfidence(fileName);
        const typeDescription = documentTypeDetector.getTypeDescription(documentType);
        
        console.log('[Textract Analyze] Detected type:', documentType, 'Confidence:', typeConfidence);

        // Step 2: Handle different file types
        let analysis;
        
        if (fileExtension === 'txt') {
            // TXT files are treated as label files - no Textract needed
            console.log('[Textract Analyze] Processing TXT file as label');
            analysis = {
                documentType: DocumentType.GENERAL,
                confidence: 1.0,
                general: {
                    title: 'Label File',
                    summary: 'Text label file uploaded',
                    keyPoints: ['Label file for training data'],
                    documentLength: 0,
                    category: 'Label'
                },
                processingTime: 0,
                textractApi: 'none'
            };
        } else {
            // Images and PDFs go through Textract
            analysis = await smartTextractService.analyzeDocument(
                'quarantine-upload-321351515',
                s3Key,
                documentType
            );
            console.log('[Textract Analyze] Textract analysis complete');
        }

        // Step 3: Generate AI summary with Bedrock (optional, can be async)
        let bedrockSummary;
        try {
            bedrockSummary = await bedrockService.generateSummary(analysis, 'simple');
            console.log('[Textract Analyze] Bedrock summary generated');
        } catch (error) {
            console.warn('[Textract Analyze] Bedrock summary failed, continuing without it:', error);
        }

        // Add Bedrock summary to analysis
        if (bedrockSummary) {
            analysis.bedrockSummary = bedrockSummary;
        }

        // Step 4: Save to DynamoDB with enhanced schema
        const documentId = `doc_${Date.now()}`;
        
        const enhancedMetadata: EnhancedDocumentMetadata = {
            FileID: s3Key,
            BucketName: 'quarantine-upload-321351515',
            DocumentType: documentType,
            UploadTimestamp: new Date().toISOString(),
            ProcessingStatus: 'COMPLETED',
            UserId: userId,
            DocumentId: documentId,
            Analysis: analysis,
            // Legacy fields for backward compatibility
            ExtractedInfo: analysis.invoice ? {
                vendor: analysis.invoice.vendor,
                total: analysis.invoice.total,
                date: analysis.invoice.date,
                confidence: analysis.confidence
            } : undefined
        };

        const success = await dynamoDBService.saveEnhancedMetadata(enhancedMetadata);

        if (success) {
            console.log('[Textract Analyze] Document saved to DynamoDB successfully');
        } else {
            console.error('[Textract Analyze] Failed to save document to DynamoDB');
        }

        // Step 5: Return response based on document type
        const response = buildResponse(analysis, documentId, s3Key, userId, typeDescription, fileExtension);

        return NextResponse.json({
            success: true,
            data: response
        }, { status: 200 });

    } catch (error) {
        console.error('[Textract Analyze] Error processing document:', error);
        return NextResponse.json({ 
            error: 'Failed to process document',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Build response based on document type
 */
function buildResponse(analysis: any, documentId: string, s3Key: string, userId: string, typeDescription: string, fileExtension?: string) {
    const baseResponse = {
        documentId,
        s3Key,
        userId,
        documentType: analysis.documentType,
        typeDescription,
        confidence: analysis.confidence,
        processingTime: analysis.processingTime
    };

    // Handle TXT files specially
    if (fileExtension === 'txt') {
        return {
            ...baseResponse,
            vendor: 'Label File',
            total: 'N/A',
            date: 'N/A',
            fileType: 'label'
        };
    }

    // Add type-specific data
    if (analysis.invoice) {
        return {
            ...baseResponse,
            vendor: analysis.invoice.vendor || 'Unknown',
            total: analysis.invoice.total || 'N/A',
            date: analysis.invoice.date || 'Unknown',
            invoiceNumber: analysis.invoice.invoiceNumber,
            fileType: 'invoice'
        };
    } else if (analysis.general) {
        return {
            ...baseResponse,
            title: analysis.general.title || 'Untitled',
            summary: analysis.general.summary || 'Document processed',
            keyPoints: analysis.general.keyPoints || [],
            documentLength: analysis.general.documentLength || 0,
            fileType: 'general'
        };
    }

    // Add Bedrock summary if available
    if (analysis.bedrockSummary) {
        return {
            ...baseResponse,
            aiSummary: {
                keyPoints: analysis.bedrockSummary.keyPoints,
                explanation: analysis.bedrockSummary.simplifiedExplanation,
                riskFactors: analysis.bedrockSummary.riskFactors,
                actionItems: analysis.bedrockSummary.actionItems
            }
        };
    }

    return baseResponse;
}