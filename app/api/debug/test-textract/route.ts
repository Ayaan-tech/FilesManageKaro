import { NextRequest, NextResponse } from "next/server";
import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { auth } from "@clerk/nextjs/server";

const textractClient = new TextractClient({
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

        // Test with a sample document (you'll need to upload one first)
        const testS3Key = "textract/images/test/sample-receipt.jpg";
        
        const command = new AnalyzeExpenseCommand({
            Document: {
                S3Object: {
                    Bucket: 'quarantine-upload-321351515',
                    Name: testS3Key
                }
            }
        });

        const response = await textractClient.send(command);
        
        return NextResponse.json({
            success: true,
            message: "Textract test successful",
            documentCount: response.ExpenseDocuments?.length || 0,
            hasData: !!response.ExpenseDocuments?.[0]?.SummaryFields?.length
        }, { status: 200 });
        
    } catch (error) {
        console.error('Textract test failed:', error);
        return NextResponse.json({ 
            error: 'Textract test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}