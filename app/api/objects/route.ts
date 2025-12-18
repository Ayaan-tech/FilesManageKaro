import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME } from '@/lib/s3-config'

export async function GET(request: NextRequest) {
    try {
        const prefix = request.nextUrl.searchParams.get("prefix") || "";
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Delimiter: '/',
            Prefix: prefix,
        })
        
        const result = await s3Client.send(command);
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