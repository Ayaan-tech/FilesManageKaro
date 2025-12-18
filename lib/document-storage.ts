import { promises as fs } from 'fs';
import path from 'path';

export interface DocumentData {
  documentId: string;
  vendor: string;
  totalAmount: string;
  invoiceDate: string;
  s3Key: string;
  uploadTime: string;
  fileType: string;
  userId: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'documents.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load documents from storage
export async function loadDocuments(): Promise<DocumentData[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

// Save documents to storage
export async function saveDocuments(documents: DocumentData[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(documents, null, 2));
}

// Add a new document
export async function addDocument(document: DocumentData): Promise<void> {
  const documents = await loadDocuments();
  documents.push(document);
  await saveDocuments(documents);
}

// Get documents for a specific user
export async function getUserDocuments(userId: string): Promise<DocumentData[]> {
  const documents = await loadDocuments();
  return documents.filter(doc => doc.userId === userId);
}