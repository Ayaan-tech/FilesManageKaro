'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, 
  File, 
  Download, 
  Calendar, 
  HardDrive, 
  ChevronRight, 
  ChevronDown, 
  Search,
  RefreshCw,
  Home,
  FolderOpen,
  Upload,
  X,
  Check,
  RotateCcw,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  Shield,
  CloudUpload,
  MoreHorizontal,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToastContainer } from '@/components/ui/toast';
import { UploadManager, UploadProgress, UploadError } from '@/lib/upload-manager';

// Threshold for using multipart upload (5MB)
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;

interface S3Object {
  Key: string;
  Size: number;
  LastModified: string;
}

interface ApiResponse {
  status: S3Object[];
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  children?: FileNode[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'scanning';
  isMultipart?: boolean;
  currentPart?: number;
  totalParts?: number;
  errorMessage?: string;
  uploadManager?: UploadManager;
  scanStatus?: 'pending' | 'scanning' | 'clean' | 'infected' | 'error';
}

// Badge component for status indicators
const Badge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Progress ring component for upload visualization
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ 
  progress, 
  size = 32, 
  strokeWidth = 3 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-400 transition-all duration-300 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
        {progress}%
      </span>
    </div>
  );
};

const FileExplorer: React.FC = () => {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>>([]);
  
  const uploadManagersRef = useRef<Map<string, UploadManager>>(new Map());

  const triggerFileScan = async (key: string): Promise<void> => {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        bucket: "quarantine-upload-321351515",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Scan trigger failed");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchFiles = async (prefix: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      if (demoMode) {
        const { sampleS3Data } = await import('@/lib/sample-data');
        const tree = buildFileTree(sampleS3Data);
        setFileStructure(tree);
        return;
      }
      
      const response = await fetch(`/api/objects?prefix=${prefix}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.status) {
        const tree = buildFileTree(data.status);
        setFileStructure(tree);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      if (!demoMode) {
        setDemoMode(true);
        const { sampleS3Data } = await import('@/lib/sample-data');
        const tree = buildFileTree(sampleS3Data);
        setFileStructure(tree);
      }
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (objects: S3Object[]): FileNode[] => {
    const tree: { [key: string]: FileNode } = {};
    const roots: FileNode[] = [];

    objects.forEach(obj => {
      if (!obj.Key) return;

      const parts = obj.Key.split('/').filter(Boolean);
      let currentLevel = tree;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isLastPart = index === parts.length - 1;
        const isFile = isLastPart && !obj.Key?.endsWith('/');

        if (!currentLevel[part]) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            size: isFile ? obj.Size : undefined,
            lastModified: isFile ? obj.LastModified : undefined,
            children: isFile ? undefined : []
          };

          currentLevel[part] = node;

          if (index === 0) {
            roots.push(node);
          }
        }

        if (!isFile && currentLevel[part].children) {
          const childrenMap = currentLevel[part].children!.reduce((acc, child) => {
            acc[child.name] = child;
            return acc;
          }, {} as { [key: string]: FileNode });
          currentLevel = childrenMap;
        }
      });
    });

    return roots;
  };

  const uploadSmallFile = async (file: File, fullKey: string): Promise<void> => {
    const newUploadingFiles = new Map(uploadingFiles);
    newUploadingFiles.set(fullKey, { file, progress: 0, status: 'uploading', isMultipart: false });
    setUploadingFiles(new Map(newUploadingFiles));

    setUploadingFiles(current => {
      const updated = new Map(current);
      const existing = updated.get(fullKey);
      if (existing) {
        updated.set(fullKey, { ...existing, progress: 10 });
      }
      return updated;
    });

    const response = await fetch(`/api/upload?key=${encodeURIComponent(fullKey)}`);
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.statusText}`);
    }
    
    const { url } = await response.json();

    setUploadingFiles(current => {
      const updated = new Map(current);
      const existing = updated.get(fullKey);
      if (existing) {
        updated.set(fullKey, { ...existing, progress: 30 });
      }
      return updated;
    });

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    setUploadingFiles(current => {
      const updated = new Map(current);
      const existing = updated.get(fullKey);
      if (existing) {
        updated.set(fullKey, { ...existing, progress: 80 });
      }
      return updated;
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    setUploadingFiles(current => {
      const updated = new Map(current);
      const existing = updated.get(fullKey);
      if (existing) {
        updated.set(fullKey, { ...existing, status: "scanning", scanStatus: "scanning" });
      }
      return updated;
    });

    try {
      await triggerFileScan(fullKey);
      setUploadingFiles(current => {
        const updated = new Map(current);
        const existing = updated.get(fullKey);
        if (existing) {
          updated.set(fullKey, { ...existing, status: "success", scanStatus: "pending" });
        }
        return updated;
      });
    } catch (scanError) {
      console.error('Scan trigger error:', scanError);
      setUploadingFiles(current => {
        const updated = new Map(current);
        const existing = updated.get(fullKey);
        if (existing) {
          updated.set(fullKey, { ...existing, status: 'success', scanStatus: 'error' });
        }
        return updated;
      });
    }
  };

  const uploadLargeFile = async (file: File, fullKey: string): Promise<void> => {
    const uploadManager = new UploadManager({
      onProgress: (progress: UploadProgress) => {
        setUploadingFiles(current => {
          const updated = new Map(current);
          const existing = updated.get(fullKey);
          if (existing) {
            updated.set(fullKey, {
              ...existing,
              progress: progress.percentage,
              currentPart: progress.currentPart,
              totalParts: progress.totalParts,
            });
          }
          return updated;
        });
      },
      onError: (error: UploadError) => {
        setUploadingFiles(current => {
          const updated = new Map(current);
          const existing = updated.get(fullKey);
          if (existing) {
            updated.set(fullKey, { ...existing, status: 'error', errorMessage: error.message });
          }
          return updated;
        });
      },
      onComplete: async () => {
        setUploadingFiles(current => {
          const updated = new Map(current);
          const existing = updated.get(fullKey);
          if (existing) {
            updated.set(fullKey, { ...existing, progress: 100, status: 'scanning', scanStatus: 'scanning' });
          }
          return updated;
        });

        try {
          await triggerFileScan(fullKey);
          setUploadingFiles(current => {
            const updated = new Map(current);
            const existing = updated.get(fullKey);
            if (existing) {
              updated.set(fullKey, { ...existing, status: 'success', scanStatus: 'pending' });
            }
            return updated;
          });
        } catch (scanError) {
          console.error('Scan trigger error:', scanError);
          setUploadingFiles(current => {
            const updated = new Map(current);
            const existing = updated.get(fullKey);
            if (existing) {
              updated.set(fullKey, { ...existing, status: 'success', scanStatus: 'error' });
            }
            return updated;
          });
        }
      },
    });

    uploadManagersRef.current.set(fullKey, uploadManager);

    setUploadingFiles(current => {
      const updated = new Map(current);
      updated.set(fullKey, {
        file,
        progress: 0,
        status: 'uploading',
        isMultipart: true,
        currentPart: 0,
        totalParts: Math.ceil(file.size / (5 * 1024 * 1024)),
        uploadManager,
      });
      return updated;
    });

    await uploadManager.upload(file, fullKey);
    uploadManagersRef.current.delete(fullKey);
  };

  const retryUpload = async (fullKey: string) => {
    const uploadState = uploadingFiles.get(fullKey);
    if (!uploadState || uploadState.status !== 'error') return;

    const { file, isMultipart } = uploadState;
    
    setUploadingFiles(current => {
      const updated = new Map(current);
      updated.set(fullKey, { ...uploadState, progress: 0, status: 'uploading', errorMessage: undefined });
      return updated;
    });

    try {
      if (isMultipart) {
        await uploadLargeFile(file, fullKey);
      } else {
        await uploadSmallFile(file, fullKey);
      }
      
      const uploadType = isMultipart ? 'multipart' : 'direct';
      addToast('success', 'Upload Complete', `${file.name} (${formatFileSize(file.size)}) uploaded via ${uploadType}`);
      
      setTimeout(() => {
        setUploadingFiles(current => {
          const updated = new Map(current);
          updated.delete(fullKey);
          return updated;
        });
        fetchFiles();
      }, 3000);
    } catch (error) {
      console.error('Retry upload error:', error);
      addToast('error', 'Upload Failed', `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = async (folderPath: string, files: FileList) => {
    if (demoMode) {
      addToast('info', 'Demo Mode Active', 'Upload is not available in demo mode.');
      return;
    }

    addToast('info', 'Upload Started', `Uploading ${files.length} file(s)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullKey = folderPath ? `${folderPath}/${file.name}` : file.name;
      
      try {
        if (file.size > MULTIPART_THRESHOLD) {
          await uploadLargeFile(file, fullKey);
        } else {
          await uploadSmallFile(file, fullKey);
        }

        const uploadType = file.size > MULTIPART_THRESHOLD ? 'multipart' : 'direct';
        addToast('success', 'Upload Complete', `${file.name} (${formatFileSize(file.size)}) uploaded via ${uploadType}`);

        setTimeout(() => {
          setUploadingFiles(current => {
            const updated = new Map(current);
            updated.delete(fullKey);
            return updated;
          });
          fetchFiles();
        }, 3000);

      } catch (error) {
        console.error('Upload error:', error);
        addToast('error', 'Upload Failed', `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        setTimeout(() => {
          setUploadingFiles(current => {
            const updated = new Map(current);
            const existing = updated.get(fullKey);
            if (existing?.status === 'error') {
              updated.delete(fullKey);
            }
            return updated;
          });
        }, 30000);
      }
    }
  };

  const triggerFileUpload = (folderPath: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileUpload(folderPath, files);
      }
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(folderPath);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(folderPath, files);
    }
  };

  const filteredFileStructure = useMemo(() => {
    if (!searchTerm) return fileStructure;

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : undefined;
        
        if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
          acc.push({ ...node, children: filteredChildren });
          
          if (filteredChildren && filteredChildren.length > 0) {
            setExpandedFolders(prev => new Set([...prev, node.path]));
          }
        }
        
        return acc;
      }, [] as FileNode[]);
    };

    return filterNodes(fileStructure);
  }, [fileStructure, searchTerm]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: 'Root', path: '' }];
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '' }];
    
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      breadcrumbs.push({ name: part, path });
    });
    
    return breadcrumbs;
  };

  const getFileIcon = (fileName: string, size: number = 20) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const iconProps = { size, strokeWidth: 1.5 };
    
    switch (extension) {
      case 'pdf':
        return <FileText {...iconProps} className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText {...iconProps} className="text-blue-600" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet {...iconProps} className="text-emerald-600" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return <FileImage {...iconProps} className="text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
      case 'webm':
        return <FileVideo {...iconProps} className="text-pink-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive {...iconProps} className="text-amber-600" />;
      default:
        return <File {...iconProps} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getFileTypeLabel = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      docx: 'Word Document',
      xls: 'Excel Spreadsheet',
      xlsx: 'Excel Spreadsheet',
      csv: 'CSV File',
      png: 'PNG Image',
      jpg: 'JPEG Image',
      jpeg: 'JPEG Image',
      gif: 'GIF Image',
      webp: 'WebP Image',
      svg: 'SVG Image',
      mp4: 'MP4 Video',
      avi: 'AVI Video',
      mov: 'MOV Video',
      zip: 'ZIP Archive',
      rar: 'RAR Archive',
    };
    return types[extension || ''] || 'File';
  };

  const renderUploadItem = (key: string, upload: UploadingFile) => {
    const statusConfig = {
      uploading: { 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-900/20',
        borderColor: 'border-cyan-700/50',
        icon: <CloudUpload size={18} className="animate-pulse" /> 
      },
      scanning: { 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-700/50',
        icon: <Shield size={18} className="animate-pulse" /> 
      },
      success: { 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-900/20',
        borderColor: 'border-emerald-700/50',
        icon: <Check size={18} /> 
      },
      error: { 
        color: 'text-red-400', 
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-700/50',
        icon: <X size={18} /> 
      },
    };

    const config = statusConfig[upload.status];

    return (
      <div 
        key={key} 
        className={`group relative flex items-center gap-4 p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all duration-300 hover:shadow-md`}
      >
        {/* Progress Ring or Status Icon */}
        <div className={`shrink-0 ${config.color}`}>
          {upload.status === 'uploading' ? (
            <ProgressRing progress={upload.progress} size={40} strokeWidth={3} />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
              {config.icon}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {upload.file.name}
            </span>
            {upload.isMultipart && (
              <Badge variant="info" className="shrink-0">Multipart</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
            <span>{formatFileSize(upload.file.size)}</span>
            {upload.isMultipart && upload.status === 'uploading' && upload.totalParts && (
              <span>Part {upload.currentPart || 0}/{upload.totalParts}</span>
            )}
            {upload.status === 'scanning' && (
              <span className="flex items-center gap-1 text-amber-400">
                <Shield size={12} />
                Scanning for threats...
              </span>
            )}
            {upload.status === 'success' && (
              <span className="text-emerald-400">
                {upload.scanStatus === 'pending' ? 'Scan pending' : 
                 upload.scanStatus === 'error' ? 'Scan failed' : 'Complete'}
              </span>
            )}
            {upload.status === 'error' && upload.errorMessage && (
              <span className="text-red-400 truncate">{upload.errorMessage}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {upload.status === 'error' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => retryUpload(key)}
            className="shrink-0 gap-1.5 text-red-400 border-red-700 hover:bg-red-900/30"
          >
            <RotateCcw size={14} />
            Retry
          </Button>
        )}
      </div>
    );
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = depth * 20 + 16;
    const isHighlighted = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isDraggedOver = dragOver === node.path;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`
            group relative flex items-center py-3 px-4 
            transition-all duration-200 ease-out cursor-pointer
            hover:bg-slate-700/30
            ${isHighlighted ? 'bg-emerald-900/20 ring-1 ring-emerald-500/50' : ''}
            ${isDraggedOver ? 'bg-emerald-900/20 ring-2 ring-emerald-400 ring-inset' : ''}
          `}
          style={{ paddingLeft }}
          onClick={() => node.type === 'folder' && toggleFolder(node.path)}
          onDragOver={node.type === 'folder' ? (e) => handleDragOver(e, node.path) : undefined}
          onDragLeave={node.type === 'folder' ? handleDragLeave : undefined}
          onDrop={node.type === 'folder' ? (e) => handleDrop(e, node.path) : undefined}
        >
          {/* Drop overlay for folders */}
          {isDraggedOver && node.type === 'folder' && (
            <div className="absolute inset-0 bg-emerald-500/10 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center z-10 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-emerald-400 font-medium bg-slate-900/90 px-4 py-2 rounded-full shadow-lg border border-slate-700">
                <Upload size={16} />
                Drop to upload to {node.name}
              </div>
            </div>
          )}

          {/* Folder expand/collapse indicator */}
          {node.type === 'folder' && (
            <div className={`mr-1 text-slate-500 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown size={16} />
            </div>
          )}
          
          {/* File/Folder Icon */}
          <div className={`mr-3 transition-all duration-200 ${node.type === 'folder' ? 'group-hover:scale-110' : ''}`}>
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen className="text-cyan-400" size={20} strokeWidth={1.5} />
              ) : (
                <Folder className="text-cyan-400" size={20} strokeWidth={1.5} />
              )
            ) : (
              getFileIcon(node.name)
            )}
          </div>

          {/* File/Folder Info */}
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium text-white truncate ${isHighlighted ? 'text-emerald-300' : ''}`}>
                {node.name}
              </div>
              {node.type === 'file' && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {getFileTypeLabel(node.name)}
                </div>
              )}
            </div>

            {/* File metadata */}
            {node.type === 'file' && (
              <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500">
                {node.size !== undefined && (
                  <div className="flex items-center gap-1.5 min-w-[70px]">
                    <HardDrive size={12} className="text-slate-600" />
                    <span>{formatFileSize(node.size)}</span>
                  </div>
                )}
                {node.lastModified && (
                  <div className="flex items-center gap-1.5 min-w-[140px]">
                    <Calendar size={12} className="text-slate-600" />
                    <span>{formatDate(node.lastModified)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {node.type === 'folder' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileUpload(node.path);
                }}
                title="Upload to folder"
              >
                <Upload size={16} />
              </Button>
            )}
            
            {node.type === 'file' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Download:', node.path);
                  }}
                  title="Download"
                >
                  <Download size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-700"
                  onClick={(e) => e.stopPropagation()}
                  title="More options"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="transition-all duration-300 ease-in-out">
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getTotalStats = () => {
    const countFiles = (nodes: FileNode[]): { files: number; folders: number; totalSize: number } => {
      return nodes.reduce((acc, node) => {
        if (node.type === 'file') {
          acc.files++;
          acc.totalSize += node.size || 0;
        } else {
          acc.folders++;
          if (node.children) {
            const childStats = countFiles(node.children);
            acc.files += childStats.files;
            acc.folders += childStats.folders;
            acc.totalSize += childStats.totalSize;
          }
        }
        return acc;
      }, { files: 0, folders: 0, totalSize: 0 });
    };

    return countFiles(fileStructure);
  };

  const stats = getTotalStats();

  // Loading state
  if (loading) {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Card className="w-full overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-800/70 backdrop-blur-xl">
          <CardContent className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-white">Loading files...</p>
                <p className="text-sm text-slate-400 mt-1">Fetching your storage contents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Card className="w-full overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-800/70 backdrop-blur-xl">
        {/* Global drop overlay */}
        {dragOver === '' && (
          <div className="absolute inset-0 bg-emerald-500/10 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-emerald-400 bg-slate-900/95 px-8 py-6 rounded-2xl shadow-2xl border border-slate-700">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CloudUpload size={32} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">Drop files to upload</p>
                <p className="text-sm text-slate-400">Files will be uploaded to root directory</p>
              </div>
            </div>
          </div>
        )}
        
        <div
          onDragOver={(e) => handleDragOver(e, '')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, '')}
        >
          {/* Header */}
          <CardHeader className="pb-4 border-b border-slate-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Folder className="text-white" size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                    File Explorer
                    {demoMode && (
                      <Badge variant="warning">Demo Mode</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-0.5 flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <File size={12} />
                      {stats.files} files
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1">
                      <Folder size={12} />
                      {stats.folders} folders
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive size={12} />
                      {formatFileSize(stats.totalSize)}
                    </span>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => triggerFileUpload('')}
                  disabled={demoMode}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 border-0 text-white"
                >
                  <Upload size={16} />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDemoMode(!demoMode);
                    fetchFiles();
                  }}
                  className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  {demoMode ? 'Live Mode' : 'Demo'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchFiles()}
                  className="h-9 w-9 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            {/* Breadcrumb & Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-sm overflow-x-auto pb-1 sm:pb-0">
                <Home size={14} className="text-slate-500 shrink-0" />
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && <ChevronRight size={14} className="text-slate-600 shrink-0" />}
                    <button
                      className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        index === getBreadcrumbs().length - 1
                          ? 'bg-slate-700 text-white font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                      onClick={() => setCurrentPath(crumb.path)}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Search & View Toggle */}
              <div className="flex items-center gap-2 sm:ml-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:bg-slate-900 focus:border-emerald-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center border border-slate-600 rounded-lg overflow-hidden bg-slate-900/50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                    title="List view"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                    title="Grid view"
                  >
                    <Grid3X3 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && !demoMode && (
              <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <X size={14} />
                  {error}
                </p>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Upload Progress Section */}
            {uploadingFiles.size > 0 && (
              <div className="border-b border-slate-700/50 bg-slate-900/50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CloudUpload size={16} className="text-emerald-400" />
                      Uploads in Progress
                      <Badge variant="info">{uploadingFiles.size}</Badge>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {Array.from(uploadingFiles.entries()).map(([key, upload]) => 
                      renderUploadItem(key, upload)
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* File List */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredFileStructure.length > 0 ? (
                <div className="divide-y divide-slate-700/50">
                  {filteredFileStructure.map((node) => renderFileNode(node))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-6">
                    <Folder size={40} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchTerm ? 'No matching files' : 'No files yet'}
                  </h3>
                  <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
                    {searchTerm 
                      ? `No files or folders match "${searchTerm}". Try a different search term.`
                      : 'Your storage is empty. Upload your first file to get started.'
                    }
                  </p>
                  {!demoMode && !searchTerm && (
                    <Button
                      onClick={() => triggerFileUpload('')}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                    >
                      <Upload size={16} />
                      Upload Your First File
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </>
  );
};

export default FileExplorer;
