"use client";

import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import DocumentAnalysisResult from "./document-analysis-result";

interface AnalysisResult {
  documentId: string;
  s3Key: string;
  documentType: string;
  typeDescription?: string;
  confidence: number;
  
  // Invoice-specific
  vendor?: string;
  total?: string;
  date?: string;
  invoiceNumber?: string;
  
  // General document
  title?: string;
  summary?: string;
  keyPoints?: string[];
  documentLength?: number;
  
  // AI Summary
  aiSummary?: {
    keyPoints: string[];
    explanation: string;
    riskFactors?: string[];
    actionItems?: string[];
  };
  
  fileType: string;
}

export default function TextractUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Determine file type - handle cases where file.type might be empty
      let fileType = file.type;
      if (!fileType) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            fileType = 'image/jpeg';
            break;
          case 'png':
            fileType = 'image/png';
            break;
          case 'txt':
            fileType = 'text/plain';
            break;
          case 'pdf':
            fileType = 'application/pdf';
            break;
          default:
            fileType = 'application/octet-stream';
        }
      }

      // Step 1: Get presigned URL
      console.log('[Frontend] Requesting upload URL for:', file.name, fileType);
      const uploadResponse = await fetch("/api/textract/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: fileType,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('[Frontend] Upload URL request failed:', errorData);
        throw new Error(errorData.details || errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = await uploadResponse.json();
      console.log('[Frontend] Got upload URL, key:', key);

      // Step 2: Upload file to S3
      console.log('[Frontend] Uploading file to S3...');
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": fileType,
        },
      });

      if (!s3Response.ok) {
        const s3Error = await s3Response.text().catch(() => 'Unknown S3 error');
        console.error('[Frontend] S3 upload failed:', s3Response.status, s3Error);
        throw new Error(`Failed to upload file to S3: ${s3Response.status} ${s3Error}`);
      }

      console.log('[Frontend] File uploaded to S3 successfully');

      setUploading(false);

      // Step 3: Analyze all files (including TXT files for metadata storage)
      setAnalyzing(true);
      
      console.log('[Frontend] Starting analysis for key:', key);
      const analyzeResponse = await fetch("/api/textract/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key: key }),
      });
      
      console.log('[Frontend] Analyze response status:', analyzeResponse.status);

      if (!analyzeResponse.ok) {
        const analyzeError = await analyzeResponse.json().catch(() => ({}));
        console.error('[Frontend] Analysis failed:', analyzeError);
        throw new Error(analyzeError.details || analyzeError.error || "Failed to analyze document");
      }

      const { data } = await analyzeResponse.json();
      console.log('[Frontend] Analysis complete:', data);
      setResult(data);
      
      // Trigger a page refresh to update document history
      // In a production app, you'd use a state management solution or context
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('documentUploaded'));
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Document Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload any document for intelligent analysis and AI-powered insights
        </p>
      </div>

      <div className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".jpg,.jpeg,.png,.txt,.pdf"
            onChange={handleFileChange}
            disabled={uploading || analyzing}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {file ? file.name : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Any document type: JPG, PNG, TXT, PDF up to 10MB
            </span>
          </label>
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={uploadAndAnalyze}
            disabled={uploading || analyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading || analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploading ? "Uploading..." : "Analyzing..."}
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Upload & Analyze
              </>
            )}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && <DocumentAnalysisResult result={result} />}
      </div>
    </div>
  );
}
