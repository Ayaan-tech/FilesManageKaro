import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";
import { BedrockService } from "@/lib/services/bedrock-service";

const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
const bedrockService = new BedrockService('us-east-1');

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId, question } = await request.json();
        
        if (!documentId || !question) {
            return NextResponse.json({ 
                error: "Document ID and question are required" 
            }, { status: 400 });
        }

        console.log('[Bedrock Ask] Processing question for document:', documentId);

        // Get document from DynamoDB
        const document = await dynamoDBService.getEnhancedMetadata(documentId);
        
        if (!document || document.UserId !== userId) {
            return NextResponse.json({ 
                error: "Document not found or access denied" 
            }, { status: 404 });
        }

        // Ask Bedrock the question
        const answer = await bedrockService.askQuestion(document.Analysis, question);

        console.log('[Bedrock Ask] Question answered successfully');

        return NextResponse.json({
            success: true,
            data: {
                question,
                answer,
                documentId,
                documentType: document.DocumentType
            }
        }, { status: 200 });

    } catch (error) {
        console.error('[Bedrock Ask] Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process question',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}