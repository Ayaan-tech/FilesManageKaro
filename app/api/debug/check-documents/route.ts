import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('[Debug] Checking documents for user:', userId);

        const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
        
        // Try both methods
        let enhancedDocs = [];
        let legacyDocs = [];
        
        try {
            enhancedDocs = await dynamoDBService.getUserEnhancedDocuments(userId);
            console.log('[Debug] Enhanced documents:', enhancedDocs.length);
        } catch (error) {
            console.error('[Debug] Enhanced documents error:', error);
        }
        
        try {
            legacyDocs = await dynamoDBService.getUserDocuments(userId);
            console.log('[Debug] Legacy documents:', legacyDocs.length);
        } catch (error) {
            console.error('[Debug] Legacy documents error:', error);
        }

        return NextResponse.json({
            success: true,
            debug: {
                userId,
                enhancedCount: enhancedDocs.length,
                legacyCount: legacyDocs.length,
                enhancedSample: enhancedDocs[0] || null,
                legacySample: legacyDocs[0] || null,
                allDocs: [...enhancedDocs, ...legacyDocs]
            }
        }, { status: 200 });
        
    } catch (error) {
        console.error('[Debug] Error:', error);
        return NextResponse.json({ 
            error: 'Debug failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}