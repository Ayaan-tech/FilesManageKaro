"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, DollarSign, Building2, Loader2, Image, FileType, Download, FileSpreadsheet } from "lucide-react";

interface Document {
  documentId: string;
  vendor: string;
  totalAmount: string;
  invoiceDate: string;
  s3Key: string;
  uploadTime: string;
  fileType?: string;
}

export default function DocumentHistory() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    
    // Listen for document upload events
    const handleDocumentUploaded = () => {
      console.log('[DocumentHistory] Document uploaded event received, refreshing...');
      fetchDocuments();
    };
    
    window.addEventListener('documentUploaded', handleDocumentUploaded);
    
    return () => {
      window.removeEventListener('documentUploaded', handleDocumentUploaded);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      console.log('[DocumentHistory] Fetching documents...');
      const response = await fetch("/api/textract/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      console.log('[DocumentHistory] Received data:', data);
      console.log('[DocumentHistory] Documents count:', data.documents?.length || 0);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('[DocumentHistory] Error fetching documents:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exportDocument = async (documentId: string) => {
    try {
      setExporting(documentId);
      console.log('[Export] Exporting document:', documentId);
      
      const response = await fetch(`/api/textract/export?documentId=${encodeURIComponent(documentId)}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[Export] Document exported successfully');
    } catch (err) {
      console.error('[Export] Error:', err);
      alert('Failed to export document. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const exportAllDocuments = async () => {
    try {
      setExporting('all');
      console.log('[Export] Exporting all documents');
      
      const response = await fetch('/api/textract/export');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_documents_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[Export] All documents exported successfully');
    } catch (err) {
      console.error('[Export] Error:', err);
      alert('Failed to export documents. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading documents...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Document History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View all your processed documents and their extracted data
          </p>
        </div>
        <div className="flex gap-2">
          {documents.length > 0 && (
            <button
              onClick={exportAllDocuments}
              disabled={exporting === 'all'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {exporting === 'all' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export All CSV
                </>
              )}
            </button>
          )}
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your first document to get started with analysis
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.documentId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {doc.fileType === 'label' ? (
                      <FileType className="w-5 h-5 text-green-600" />
                    ) : doc.fileType === 'image' ? (
                      <Image className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {doc.documentId}
                    </span>
                    {doc.fileType && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {doc.fileType}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Vendor
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {doc.vendor}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Amount
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {doc.totalAmount}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Invoice Date
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(doc.invoiceDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(doc.uploadTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => exportDocument(doc.s3Key)}
                    disabled={exporting === doc.s3Key}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    {exporting === doc.s3Key ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}