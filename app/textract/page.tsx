import NavBar from "@/components/nav";
import TextractUploader from "@/components/textract-uploader";
import DocumentHistory from "@/components/document-history";

export default function TextractPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Intelligent Document Analysis
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Upload any document for intelligent analysis. Our AI automatically detects document types 
              and provides contextual insights - from invoice data extraction to contract summaries 
              and general document understanding.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">📄 Invoices & Receipts</span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">📋 Contracts & Legal</span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 rounded-full">🏥 Medical Documents</span>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">📊 Reports & Analysis</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full">📝 General Documents</span>
            </div>
          </div>
          
          <TextractUploader />
          <DocumentHistory />
        </div>
      </div>
    </div>
  );
}