import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('[Debug Documents] Testing document retrieval for user:', userId);

        // Initialize DynamoDB service
        const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
        
        // Test table existence
        const tableExists = await dynamoDBService.ensureTableExists();
        console.log('[Debug Documents] Table exists:', tableExists);
        
        // Get documents
        const userDocuments = await dynamoDBService.getUserDocuments(userId);
        console.log('[Debug Documents] Raw documents from DynamoDB:', JSON.stringify(userDocuments, null, 2));
        
        // Transform documents
        const transformedDocuments = userDocuments.map(doc => ({
            documentId: doc.DocumentId,
            vendor: doc.ExtractedInfo?.vendor || 'Unknown',
            totalAmount: doc.ExtractedInfo?.total || 'N/A',
            invoiceDate: doc.ExtractedInfo?.date || 'Unknown',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: doc.DocumentType?.toLowerCase() || 'unknown'
        }));

        console.log('[Debug Documents] Transformed documents:', JSON.stringify(transformedDocuments, null, 2));

        return NextResponse.json({
            success: true,
            debug: {
                userId,
                tableExists,
                rawDocumentCount: userDocuments.length,
                transformedDocumentCount: transformedDocuments.length,
                rawDocuments: userDocuments,
                transformedDocuments
            }
        }, { status: 200 });
        
    } catch (error) {
        console.error('[Debug Documents] Error:', error);
        return NextResponse.json({ 
            error: 'Debug failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}