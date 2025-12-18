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
              Document Analysis with AWS Textract
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Upload receipts, invoices, and documents to automatically extract key information 
              like vendor names, amounts, and dates using AWS Textract AI.
            </p>
          </div>
          
          <TextractUploader />
          <DocumentHistory />
        </div>
      </div>
    </div>
  );
}