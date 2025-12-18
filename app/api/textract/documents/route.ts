import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Initialize DynamoDB service
        const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
        
        // Get real documents for the user from DynamoDB
        const userDocuments = await dynamoDBService.getUserDocuments(userId);
        
        console.log('[Documents API] Found', userDocuments.length, 'documents for user:', userId);

        // Transform DynamoDB format to frontend format
        const transformedDocuments = userDocuments.map(doc => ({
            documentId: doc.DocumentId,
            vendor: doc.ExtractedInfo.vendor || 'Unknown',
            totalAmount: doc.ExtractedInfo.total || 'N/A',
            invoiceDate: doc.ExtractedInfo.date || 'Unknown',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: doc.DocumentType.toLowerCase()
        }));

        return NextResponse.json({
            success: true,
            documents: transformedDocuments
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch documents',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 