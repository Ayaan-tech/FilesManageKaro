"use client";

import { FileText, Calendar, DollarSign, Building2, Brain, AlertTriangle, CheckCircle, FileType, Image } from "lucide-react";

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

interface DocumentAnalysisResultProps {
  result: AnalysisResult;
}

export default function DocumentAnalysisResult({ result }: DocumentAnalysisResultProps) {
  const getDocumentIcon = () => {
    switch (result.documentType) {
      case 'invoice':
        return <DollarSign className="w-6 h-6 text-green-600" />;
      case 'contract':
      case 'legal':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'medical':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'report':
        return <FileType className="w-6 h-6 text-purple-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderInvoiceAnalysis = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vendor</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {result.vendor || 'Unknown'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {result.total || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {result.date || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
      
      {result.invoiceNumber && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Number</p>
          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {result.invoiceNumber}
          </p>
        </div>
      )}
    </div>
  );

  const renderGeneralAnalysis = () => (
    <div className="space-y-4">
      {result.title && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Document Title</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {result.title}
          </p>
        </div>
      )}
      
      {result.summary && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Summary</p>
          <p className="text-gray-900 dark:text-gray-100">
            {result.summary}
          </p>
        </div>
      )}
      
      {result.keyPoints && result.keyPoints.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Key Points</p>
          <ul className="space-y-1">
            {result.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {result.documentLength && (
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Length: {result.documentLength} words</span>
        </div>
      )}
    </div>
  );

  const renderAISummary = () => {
    if (!result.aiSummary) return null;

    return (
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">AI Summary</h4>
        </div>
        
        {result.aiSummary.explanation && (
          <div className="mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {result.aiSummary.explanation}
            </p>
          </div>
        )}
        
        {result.aiSummary.keyPoints && result.aiSummary.keyPoints.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Key Insights:</p>
            <ul className="space-y-1">
              {result.aiSummary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result.aiSummary.riskFactors && result.aiSummary.riskFactors.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Risk Factors:</p>
            <ul className="space-y-1">
              {result.aiSummary.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result.aiSummary.actionItems && result.aiSummary.actionItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Action Items:</p>
            <ul className="space-y-1">
              {result.aiSummary.actionItems.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getDocumentIcon()}
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Analysis Complete
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {result.typeDescription || `${result.documentType} document`}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
          <p className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
            {Math.round(result.confidence)}%
          </p>
        </div>
      </div>

      {/* Document Type Specific Analysis */}
      {result.documentType === 'invoice' && renderInvoiceAnalysis()}
      {result.documentType !== 'invoice' && renderGeneralAnalysis()}

      {/* AI Summary */}
      {renderAISummary()}

      {/* Document Metadata */}
      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Document ID: {result.documentId}</span>
          <span>Type: {result.fileType}</span>
        </div>
      </div>
    </div>
  );
}