import { NextRequest, NextResponse } from "next/server";
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'

const s3client = new S3Client({
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
    },
    region:'ap-south-1',
})

export async function GET(request: NextRequest) {
    try {
        const key = request.nextUrl.searchParams.get("key");
        if(!key) {
            return NextResponse.json({ 
                error: "Key parameter is required" 
            }, { status: 400 });
        }

        const command = new PutObjectCommand({
            Bucket: 'myawsstoragebucket51515',
            Key: key,
        });

        const url = await getSignedUrl(s3client, command, { expiresIn: 3600 });
        
        return NextResponse.json({ url }, { status: 200 });
        
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ 
            error: 'Failed to generate presigned URL',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}