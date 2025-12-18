import NavBar from "@/components/nav";
import FileExplorer from "@/components/file-explorer";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar/>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AWS S3 File Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Browse and manage your S3 bucket files with ease
            </p>
            <div className="flex gap-4">
              <a 
                href="/textract" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Document Analysis →
              </a>
            </div>
          </div>
          <FileExplorer />
        </div>
      </div>
    </div>
  );
}
