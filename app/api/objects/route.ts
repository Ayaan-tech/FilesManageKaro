import { NextRequest, NextResponse } from "next/server";
import {S3Client, ListObjectsV2Command} from '@aws-sdk/client-s3'

const s3client = new S3Client({
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
    },
    region:'ap-south-1',
})

export async function GET(request: NextRequest) {
    try {
        const prefix = request.nextUrl.searchParams.get("prefix") || "";
        const command = new ListObjectsV2Command({
            Bucket:'myawsstoragebucket51515',
            Delimiter: '/',
            Prefix: prefix,
        })
        
        const result = await s3client.send(command);
        console.log('S3 Response:', result);
        
        const modifiedResponse = result.Contents?.map((item) => ({
            Key: item.Key,
            Size: item.Size || 0,
            LastModified: item.LastModified?.toISOString() || new Date().toISOString(),
        })) || [];

        // Also include CommonPrefixes (folders) as folder entries
        const folderEntries = result.CommonPrefixes?.map((prefix) => ({
            Key: prefix.Prefix,
            Size: 0,
            LastModified: new Date().toISOString(),
        })) || [];

        const allEntries = [...modifiedResponse, ...folderEntries];
        
        return NextResponse.json({ 
            status: allEntries,
            metadata: {
                totalCount: allEntries.length,
                isTruncated: result.IsTruncated || false,
                prefix: prefix
            }
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error fetching S3 objects:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch objects',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}