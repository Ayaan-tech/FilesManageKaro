import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const documentId = url.searchParams.get('documentId');
        const format = url.searchParams.get('format') || 'csv';

        console.log('[Export API] Export request:', { userId, documentId, format });

        // Initialize DynamoDB service
        const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
        
        let documents;
        let filename;

        if (documentId) {
            // Export single document
            const document = await dynamoDBService.getDocumentMetadata(documentId);
            if (!document || document.UserId !== userId) {
                return NextResponse.json({ error: "Document not found" }, { status: 404 });
            }
            documents = [document];
            filename = `document_${documentId.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
        } else {
            // Export all user documents
            documents = await dynamoDBService.getUserDocuments(userId);
            filename = `all_documents_${new Date().toISOString().split('T')[0]}.csv`;
        }

        if (documents.length === 0) {
            return NextResponse.json({ error: "No documents found" }, { status: 404 });
        }

        // Generate CSV content
        const csvContent = generateCSV(documents);

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        console.error('[Export API] Error:', error);
        return NextResponse.json({ 
            error: 'Export failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function generateCSV(documents: any[]): string {
    // CSV headers
    const headers = [
        'Document ID',
        'Vendor Name',
        'Total Amount',
        'Invoice Date',
        'Document Type',
        'Upload Date',
        'Processing Status',
        'S3 File Path',
        'Confidence Score'
    ];

    // Convert documents to CSV rows
    const rows = documents.map(doc => [
        doc.DocumentId || 'N/A',
        doc.ExtractedInfo?.vendor || 'Unknown',
        doc.ExtractedInfo?.total || 'N/A',
        doc.ExtractedInfo?.date || 'Unknown',
        doc.DocumentType || 'Unknown',
        formatDate(doc.UploadTimestamp),
        doc.ProcessingStatus || 'Unknown',
        doc.FileID || 'N/A',
        doc.ExtractedInfo?.confidence || 'N/A'
    ]);

    // Combine headers and rows
    const allRows = [headers, ...rows];

    // Convert to CSV format
    return allRows.map(row => 
        row.map(field => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        }).join(',')
    ).join('\n');
}

function formatDate(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoString || 'N/A';
    }
}