import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DocumentType, BedrockSummary, DocumentAnalysis } from '../types/document-types';

export class BedrockService {
  private bedrockClient: BedrockRuntimeClient;

  constructor(region: string = 'us-east-1') {
    this.bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET_KEY || "",
      }
    });
  }

  /**
   * Generate AI summary for document
   */
  async generateSummary(
    analysis: DocumentAnalysis,
    complexity: 'simple' | 'technical' = 'simple'
  ): Promise<BedrockSummary> {
    try {
      const prompt = this.buildPrompt(analysis, complexity);
      const response = await this.callBedrock(prompt, 'anthropic.claude-3-haiku-20240307-v1:0');
      
      return this.parseSummaryResponse(response, complexity);
    } catch (error) {
      console.error('[Bedrock] Error generating summary:', error);
      
      // Fallback summary
      return {
        keyPoints: ['Document processed successfully'],
        simplifiedExplanation: 'This document has been analyzed and the key information has been extracted.',
        confidence: 0.5,
        language: complexity
      };
    }
  }

  /**
   * Ask a question about the document
   */
  async askQuestion(analysis: DocumentAnalysis, question: string): Promise<string> {
    try {
      const context = this.buildContextFromAnalysis(analysis);
      const prompt = `Based on this document: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
      
      const response = await this.callBedrock(prompt, 'anthropic.claude-3-haiku-20240307-v1:0');
      return response;
    } catch (error) {
      console.error('[Bedrock] Error answering question:', error);
      return 'I apologize, but I cannot answer that question about this document at the moment.';
    }
  }

  /**
   * Build prompt based on document type and analysis
   */
  private buildPrompt(analysis: DocumentAnalysis, complexity: 'simple' | 'technical'): string {
    const basePrompt = complexity === 'simple' 
      ? 'Explain this document in simple, easy-to-understand language for a general audience.'
      : 'Provide a detailed technical analysis of this document.';

    const documentContext = this.buildContextFromAnalysis(analysis);
    
    const typeSpecificPrompt = this.getTypeSpecificPrompt(analysis.documentType, complexity);
    
    return `${basePrompt}\n\n${typeSpecificPrompt}\n\nDocument content: ${documentContext}\n\nPlease provide:
1. Key Points (3-5 main takeaways)
2. Risk Factors (if any)
3. Action Items (what the reader should do)
4. Simple Explanation (in plain English)

Format your response as JSON with these fields: keyPoints, riskFactors, actionItems, simplifiedExplanation`;
  }

  /**
   * Get type-specific prompts
   */
  private getTypeSpecificPrompt(documentType: DocumentType, complexity: string): string {
    const prompts = {
      [DocumentType.INVOICE]: complexity === 'simple' 
        ? 'This is a receipt or invoice. Explain what was purchased, how much it cost, and any important details.'
        : 'Analyze this invoice for business expense categorization, tax implications, and compliance requirements.',
        
      [DocumentType.CONTRACT]: complexity === 'simple'
        ? 'This is a contract or agreement. Explain what both parties are agreeing to, important dates, and key obligations.'
        : 'Analyze this contract for legal obligations, risk factors, termination clauses, and compliance requirements.',
        
      [DocumentType.MEDICAL]: complexity === 'simple'
        ? 'This is a medical document. Explain the results, what they mean for the patient, and any recommended actions.'
        : 'Analyze this medical document for clinical findings, diagnostic implications, and treatment recommendations.',
        
      [DocumentType.LEGAL]: complexity === 'simple'
        ? 'This is a legal document. Explain what it means, what rights or obligations it creates, and what someone should do.'
        : 'Analyze this legal document for legal implications, compliance requirements, and potential risks.',
        
      [DocumentType.REPORT]: complexity === 'simple'
        ? 'This is a report or analysis. Summarize the main findings, conclusions, and recommendations.'
        : 'Analyze this report for methodology, key findings, statistical significance, and actionable insights.',
        
      [DocumentType.GENERAL]: complexity === 'simple'
        ? 'This is a general document. Summarize its main purpose, key information, and important points.'
        : 'Analyze this document for structure, key themes, important information, and actionable insights.'
    };

    return prompts[documentType] || prompts[DocumentType.GENERAL];
  }

  /**
   * Build context string from document analysis
   */
  private buildContextFromAnalysis(analysis: DocumentAnalysis): string {
    let context = '';

    if (analysis.invoice) {
      context = `Invoice from ${analysis.invoice.vendor || 'Unknown'} for ${analysis.invoice.total || 'Unknown amount'} dated ${analysis.invoice.date || 'Unknown date'}`;
    } else if (analysis.general && analysis.fullText) {
      // Use first 2000 characters to stay within token limits
      context = analysis.fullText.substring(0, 2000);
    } else if (analysis.general) {
      context = `Document titled "${analysis.general.title}" with ${analysis.general.documentLength} words. Key points: ${analysis.general.keyPoints?.join(', ')}`;
    }

    return context || 'Document content not available';
  }

  /**
   * Call Bedrock API
   */
  private async callBedrock(prompt: string, modelId: string): Promise<string> {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  /**
   * Parse Bedrock response into structured summary
   */
  private parseSummaryResponse(response: string, complexity: 'simple' | 'technical'): BedrockSummary {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      
      return {
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [parsed.keyPoints || 'Key information extracted'],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : (parsed.riskFactors ? [parsed.riskFactors] : []),
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : (parsed.actionItems ? [parsed.actionItems] : []),
        simplifiedExplanation: parsed.simplifiedExplanation || 'Document has been analyzed successfully.',
        confidence: 0.85,
        language: complexity
      };
    } catch (error) {
      // Fallback: parse as plain text
      const lines = response.split('\n').filter(line => line.trim());
      
      return {
        keyPoints: lines.slice(0, 3).map(line => line.replace(/^[-•*]\s*/, '')),
        riskFactors: [],
        actionItems: [],
        simplifiedExplanation: lines.join(' ').substring(0, 500),
        confidence: 0.60,
        language: complexity
      };
    }
  }

  /**
   * Check if Bedrock is available in the region
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Simple test call
      await this.callBedrock('Test', 'anthropic.claude-3-haiku-20240307-v1:0');
      return true;
    } catch (error) {
      console.warn('[Bedrock] Service not available:', error);
      return false;
    }
  }
}