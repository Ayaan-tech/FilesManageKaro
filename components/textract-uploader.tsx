"use client";

import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface AnalysisResult {
  vendor: string;
  total: string;
  date: string;
  documentId: string;
  s3Key: string;
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

      // Step 3: Check if file needs Textract analysis
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'txt') {
        // TXT files are labels, no analysis needed
        setResult({
          vendor: "Label File",
          total: "N/A",
          date: "N/A",
          documentId: `label_${Date.now()}`,
          s3Key: key
        });
      } else {
        // Images and PDFs need Textract analysis
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
      }
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
          Upload receipts or invoices for automatic data extraction
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
              JPG, PNG, TXT, PDF up to 10MB
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
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              Analysis Complete
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vendor:
                </span>
                <p className="text-gray-900 dark:text-gray-100">{result.vendor}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Amount:
                </span>
                <p className="text-gray-900 dark:text-gray-100">{result.total}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date:
                </span>
                <p className="text-gray-900 dark:text-gray-100">{result.date}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Document ID:
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {result.documentId}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
