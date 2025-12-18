import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { s3Key } = await request.json();
        
        console.log('[Debug Analyze] Testing with s3Key:', s3Key);
        console.log('[Debug Analyze] User ID:', userId);
        
        // Test basic functionality without Textract first
        return NextResponse.json({
            success: true,
            message: "Debug test successful",
            s3Key: s3Key,
            userId: userId,
            timestamp: new Date().toISOString()
        }, { status: 200 });
        
    } catch (error) {
        console.error('[Debug Analyze] Error:', error);
        return NextResponse.json({ 
            error: 'Debug test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}