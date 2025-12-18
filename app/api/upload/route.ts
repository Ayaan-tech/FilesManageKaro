import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, BUCKET_NAME_PRODUCTION } from '@/lib/s3-config'

export async function GET(request: NextRequest) {
    try {
        const key = request.nextUrl.searchParams.get("key");
        if(!key) {
            return NextResponse.json({ 
                error: "Key parameter is required" 
            }, { status: 400 });
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME_PRODUCTION,
            Key: key,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return NextResponse.json({ url }, { status: 200 });
        
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ 
            error: 'Failed to generate presigned URL',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}