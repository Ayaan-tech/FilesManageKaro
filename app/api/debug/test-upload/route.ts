import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { auth } from "@clerk/nextjs/server";

const s3client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
    },
    region: process.env.AWS_REGION || 'ap-south-1',
});

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Test AWS connection
        const command = new ListBucketsCommand({});
        const result = await s3client.send(command);
        
        return NextResponse.json({
            success: true,
            message: "AWS connection successful",
            userId: userId,
            buckets: result.Buckets?.map(b => b.Name) || [],
            env: {
                hasAccessKey: !!process.env.AWS_ACCESS_KEY,
                hasSecretKey: !!process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            }
        }, { status: 200 });
        
    } catch (error) {
        console.error('AWS connection test failed:', error);
        return NextResponse.json({ 
            error: 'AWS connection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            env: {
                hasAccessKey: !!process.env.AWS_ACCESS_KEY,
                hasSecretKey: !!process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            }
        }, { status: 500 });
    }
}