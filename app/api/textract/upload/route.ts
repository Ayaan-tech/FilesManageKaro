import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from "@clerk/nextjs/server";

const s3client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
    },
    region: 'ap-south-1',
});

export async function POST(request: NextRequest) {
    try {
        console.log('[Textract Upload] Starting upload process...');
        
        const { userId } = await auth();
        
        if (!userId) {
            console.error('[Textract Upload] Unauthorized - no userId');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('[Textract Upload] User authenticated:', userId);

        const { fileName, fileType } = await request.json();
        console.log('[Textract Upload] Request data:', { fileName, fileType });
        
        if (!fileName || !fileType) {
            return NextResponse.json({ 
                error: "fileName and fileType are required" 
            }, { status: 400 });
        }

        // Validate file type
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'txt', 'pdf'];
        
        if (!allowedExtensions.includes(fileExtension || '')) {
            return NextResponse.json({ 
                error: "Unsupported file type. Please upload JPG, PNG, TXT, or PDF files." 
            }, { status: 400 });
        }

        // Create organized folder structure
        let folder = 'textract';
        if (fileExtension === 'txt') {
            folder = 'textract/labels';
        } else if (['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
            folder = 'textract/images';
        } else if (fileExtension === 'pdf') {
            folder = 'textract/documents';
        }

        const key = `${folder}/${userId}/${Date.now()}_${fileName}`;

        const command = new PutObjectCommand({
            Bucket: 'quarantine-upload-321351515',
            Key: key,
            ContentType: fileType,
        });

        console.log('[Textract Upload] Generating signed URL for key:', key);
        const uploadUrl = await getSignedUrl(s3client, command, { expiresIn: 3600 });
        
        console.log('[Textract Upload] Success! Generated upload URL');
        return NextResponse.json({ 
            success: true,
            uploadUrl,
            key
        }, { status: 200 });
        
    } catch (error) {
        console.error('[Textract Upload] Error generating upload URL:', error);
        return NextResponse.json({ 
            error: 'Failed to generate upload URL',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}