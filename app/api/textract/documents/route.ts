import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBService } from "@/lib/dynamodb-service";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Initialize DynamoDB service
        const dynamoDBService = new DynamoDBService('DocumentMetadata', process.env.AWS_REGION || 'ap-south-1');
        
        // Get all documents (both enhanced and legacy)
        let userDocuments: any[] = [];
        
        try {
            // Try enhanced documents first
            const enhancedDocs = await dynamoDBService.getUserEnhancedDocuments(userId);
            console.log('[Documents API] Found', enhancedDocs.length, 'enhanced documents');
            userDocuments = [...userDocuments, ...enhancedDocs];
        } catch (error) {
            console.warn('[Documents API] Enhanced documents fetch failed:', error);
        }
        
        try {
            // Also get legacy documents
            const legacyDocs = await dynamoDBService.getUserDocuments(userId);
            console.log('[Documents API] Found', legacyDocs.length, 'legacy documents');
            
            // Filter out duplicates (documents that exist in both formats)
            const enhancedFileIds = new Set(userDocuments.map(doc => doc.FileID));
            const uniqueLegacyDocs = legacyDocs.filter(doc => !enhancedFileIds.has(doc.FileID));
            
            userDocuments = [...userDocuments, ...uniqueLegacyDocs];
        } catch (error) {
            console.warn('[Documents API] Legacy documents fetch failed:', error);
        }
        
        console.log('[Documents API] Found', userDocuments.length, 'documents for user:', userId);

        // Transform DynamoDB format to frontend format
        const transformedDocuments = userDocuments.map(doc => {
            console.log('[Documents API] Processing document:', doc.DocumentId, 'Type:', doc.DocumentType);
            
            // Handle enhanced documents (new format) - check for Analysis field
            if (doc.Analysis && typeof doc.Analysis === 'object') {
                console.log('[Documents API] Using enhanced transformation for:', doc.DocumentId);
                return transformEnhancedDocument(doc);
            }
            
            // Handle legacy documents (old format)
            console.log('[Documents API] Using legacy transformation for:', doc.DocumentId);
            return transformLegacyDocument(doc);
        });

        return NextResponse.json({
            success: true,
            documents: transformedDocuments
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch documents',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Transform enhanced document for frontend
 */
function transformEnhancedDocument(doc: any) {
    const analysis = doc.Analysis;
    const documentType = typeof doc.DocumentType === 'string' ? doc.DocumentType : doc.DocumentType?.toString() || 'unknown';
    
    console.log('[Documents API] Enhanced doc analysis:', {
        hasInvoice: !!analysis.invoice,
        hasGeneral: !!analysis.general,
        hasContract: !!analysis.contract,
        hasMedical: !!analysis.medical,
        documentType: documentType
    });
    
    if (analysis.invoice) {
        return {
            documentId: doc.DocumentId,
            vendor: analysis.invoice.vendor || 'Unknown',
            totalAmount: analysis.invoice.total || 'N/A',
            invoiceDate: analysis.invoice.date || 'Unknown',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: documentType.toLowerCase(),
            confidence: analysis.confidence,
            // Enhanced fields
            documentType: documentType,
            aiSummary: analysis.bedrockSummary?.simplifiedExplanation,
            keyPoints: analysis.bedrockSummary?.keyPoints
        };
    } else if (analysis.contract) {
        return {
            documentId: doc.DocumentId,
            vendor: analysis.contract.parties?.join(', ') || 'Contract Document',
            totalAmount: analysis.contract.contractType || 'Contract',
            invoiceDate: analysis.contract.effectiveDate || 'N/A',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: documentType.toLowerCase(),
            confidence: analysis.confidence,
            // Enhanced fields
            documentType: documentType,
            aiSummary: analysis.bedrockSummary?.simplifiedExplanation,
            keyPoints: analysis.bedrockSummary?.keyPoints
        };
    } else if (analysis.medical) {
        return {
            documentId: doc.DocumentId,
            vendor: analysis.medical.doctorName || 'Medical Document',
            totalAmount: analysis.medical.testType || 'Medical Report',
            invoiceDate: analysis.medical.testDate || 'N/A',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: documentType.toLowerCase(),
            confidence: analysis.confidence,
            // Enhanced fields
            documentType: documentType,
            aiSummary: analysis.bedrockSummary?.simplifiedExplanation,
            keyPoints: analysis.bedrockSummary?.keyPoints
        };
    } else if (analysis.general) {
        return {
            documentId: doc.DocumentId,
            vendor: analysis.general.title || 'General Document',
            totalAmount: `${analysis.general.documentLength || 0} words`,
            invoiceDate: 'N/A',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: documentType.toLowerCase(),
            confidence: analysis.confidence,
            // Enhanced fields
            documentType: documentType,
            summary: analysis.general.summary,
            keyPoints: analysis.general.keyPoints,
            aiSummary: analysis.bedrockSummary?.simplifiedExplanation
        };
    }
    
    // Fallback for any document type
    return {
        documentId: doc.DocumentId,
        vendor: `${documentType} Document`,
        totalAmount: 'Processed',
        invoiceDate: 'N/A',
        s3Key: doc.FileID,
        uploadTime: doc.UploadTimestamp,
        fileType: documentType.toLowerCase(),
        documentType: documentType,
        confidence: analysis.confidence,
        aiSummary: analysis.bedrockSummary?.simplifiedExplanation
    };
}

/**
 * Transform legacy document for frontend
 */
function transformLegacyDocument(doc: any) {
    // Handle new document types that might not have ExtractedInfo
    if (doc.DocumentType && typeof doc.DocumentType === 'string' && doc.DocumentType !== 'PDF' && doc.DocumentType !== 'Image') {
        // This is likely a new document type stored in legacy format
        return {
            documentId: doc.DocumentId,
            vendor: doc.DocumentType + ' Document',
            totalAmount: 'Processed',
            invoiceDate: 'N/A',
            s3Key: doc.FileID,
            uploadTime: doc.UploadTimestamp,
            fileType: doc.DocumentType.toLowerCase(),
            documentType: doc.DocumentType
        };
    }
    
    // Traditional legacy format
    return {
        documentId: doc.DocumentId,
        vendor: doc.ExtractedInfo?.vendor || 'Unknown',
        totalAmount: doc.ExtractedInfo?.total || 'N/A',
        invoiceDate: doc.ExtractedInfo?.date || 'Unknown',
        s3Key: doc.FileID,
        uploadTime: doc.UploadTimestamp,
        fileType: doc.DocumentType?.toLowerCase() || 'unknown'
    };
}