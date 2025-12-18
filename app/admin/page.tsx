import NavBar from "@/components/nav";
import DynamoDBViewer from "@/components/dynamodb-viewer";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              DynamoDB Admin Panel
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              View and manage all documents stored in DynamoDB
            </p>
          </div>
          
          <DynamoDBViewer />
        </div>
      </div>
    </div>
  );
}