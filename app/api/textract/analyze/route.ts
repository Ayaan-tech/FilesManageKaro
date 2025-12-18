import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { DynamoDBService } from "@/lib/dynamodb-service";

const textractClient = new TextractClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
    },
    region: process.env.AWS_REGION || 'ap-south-1',
});

const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { s3Key } = await request.json();
        
        if (!s3Key) {
            return NextResponse.json({ 
                error: "S3 key is required" 
            }, { status: 400 });
        }

        console.log('[Textract Analyze] Processing document:', s3Key);

        // Check file type based on extension
        const fileExtension = s3Key.split('.').pop()?.toLowerCase();
        
        // Handle TXT files (labels) - no Textract needed
        if (fileExtension === 'txt') {
            const documentId = `label_${Date.now()}`;
            
            // Save label file to DynamoDB
            const success = await dynamoDBService.createDocumentRecord(
                s3Key,
                'quarantine-upload-321351515',
                'Image', // Treat labels as images for simplicity
                userId,
                documentId,
                {
                    vendor: "Label File",
                    total: "N/A",
                    date: "N/A"
                }
            );

            if (!success) {
                console.error('[Textract Analyze] Failed to save label file to DynamoDB');
            }

            return NextResponse.json({
                success: true,
                data: {
                    message: "Label file stored successfully. No Textract analysis needed.",
                    vendor: "Label File",
                    total: "N/A",
                    date: "N/A",
                    documentId: documentId,
                    s3Key: s3Key,
                    userId: userId,
                    fileType: "label"
                }
            }, { status: 200 });
        }

        // Handle images and PDFs - run Textract
        if (['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension || '')) {
            try {
                console.log('[Textract Analyze] Calling AWS Textract for:', s3Key);
                
                const command = new AnalyzeExpenseCommand({
                    Document: {
                        S3Object: {
                            Bucket: 'quarantine-upload-321351515',
                            Name: s3Key
                        }
                    }
                });

                const textractResponse = await textractClient.send(command);
                console.log('[Textract Analyze] Textract response received');

                // Extract data from Textract response
                let vendor = "Unknown";
                let total = "0.00";
                let date = "Unknown";

                if (textractResponse.ExpenseDocuments && textractResponse.ExpenseDocuments.length > 0) {
                    const expenseDoc = textractResponse.ExpenseDocuments[0];
                    
                    // Extract summary fields
                    if (expenseDoc.SummaryFields) {
                        for (const field of expenseDoc.SummaryFields) {
                            const fieldType = field.Type?.Text?.toUpperCase();
                            const fieldValue = field.ValueDetection?.Text;
                            
                            if (fieldType === "VENDOR_NAME" && fieldValue) {
                                vendor = fieldValue;
                            } else if (fieldType === "TOTAL" && fieldValue) {
                                total = fieldValue;
                            } else if (fieldType === "INVOICE_RECEIPT_DATE" && fieldValue) {
                                date = fieldValue;
                            }
                        }
                    }
                }

                const documentId = `doc_${Date.now()}`;
                
                console.log('[Textract Analyze] Extracted data:', { vendor, total, date });

                const response = {
                    vendor: vendor,
                    total: total.startsWith('$') ? total : `$${total}`,
                    date: date,
                    documentId: documentId,
                    s3Key: s3Key,
                    userId: userId,
                    fileType: fileExtension === 'pdf' ? 'pdf' : 'image'
                };

                // Save the extracted data to DynamoDB
                const success = await dynamoDBService.createDocumentRecord(
                    s3Key,
                    'quarantine-upload-321351515',
                    fileExtension === 'pdf' ? 'PDF' : 'Image',
                    userId,
                    documentId,
                    {
                        vendor: vendor,
                        total: response.total,
                        date: date,
                        confidence: 95 // You can calculate this from Textract response
                    }
                );

                if (success) {
                    console.log('[Textract Analyze] Document saved to DynamoDB successfully');
                } else {
                    console.error('[Textract Analyze] Failed to save document to DynamoDB');
                }

                return NextResponse.json({
                    success: true,
                    data: response
                }, { status: 200 });

            } catch (textractError) {
                console.error('[Textract Analyze] Textract API error:', textractError);
                return NextResponse.json({
                    error: "Failed to analyze document with Textract",
                    details: textractError instanceof Error ? textractError.message : 'Unknown Textract error'
                }, { status: 500 });
            }
        }

        // Unsupported file type
        return NextResponse.json({
            error: "Unsupported file type. Please upload JPG, PNG, TXT, or PDF files.",
            fileType: fileExtension
        }, { status: 400 });
        
    } catch (error) {
        console.error('[Textract Analyze] Error processing textract:', error);
        return NextResponse.json({ 
            error: 'Failed to process document',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}