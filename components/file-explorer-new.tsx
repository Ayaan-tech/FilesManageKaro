'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { ToastContainer } from '@/components/ui/toast';

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

const FileExplorer: React.FC = () => {
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { file: File; progress: number; status: 'uploading' | 'success' | 'error' }>>(new Map());
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>>([]);

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
        // Use sample data for demo
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
      // Automatically switch to demo mode on error
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

  const handleFileUpload = async (folderPath: string, files: FileList) => {
    if (demoMode) {
      addToast('info', 'Demo Mode Active', 'Upload is not available in demo mode. Please switch to live mode.');
      return;
    }

    addToast('info', 'Upload Started', `Uploading ${files.length} file(s)...`);

    const newUploadingFiles = new Map(uploadingFiles);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullKey = folderPath ? `${folderPath}/${file.name}` : file.name;
      
      // Add to uploading state
      newUploadingFiles.set(fullKey, { file, progress: 0, status: 'uploading' });
      setUploadingFiles(new Map(newUploadingFiles));

      try {
        // Simulate progress for getting presigned URL
        newUploadingFiles.set(fullKey, { file, progress: 10, status: 'uploading' });
        setUploadingFiles(new Map(newUploadingFiles));

        // Request presigned URL
        const response = await fetch(`/api/upload?key=${encodeURIComponent(fullKey)}`);
        if (!response.ok) {
          throw new Error(`Failed to get presigned URL: ${response.statusText}`);
        }
        
        const { url } = await response.json();

        // Simulate progress for upload start
        newUploadingFiles.set(fullKey, { file, progress: 30, status: 'uploading' });
        setUploadingFiles(new Map(newUploadingFiles));

        // Upload file using presigned URL with progress simulation
        const uploadResponse = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });

        // Simulate progress during upload
        newUploadingFiles.set(fullKey, { file, progress: 80, status: 'uploading' });
        setUploadingFiles(new Map(newUploadingFiles));

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Update status to success
        newUploadingFiles.set(fullKey, { file, progress: 100, status: 'success' });
        setUploadingFiles(new Map(newUploadingFiles));

        addToast('success', 'Upload Complete', `${file.name} uploaded successfully`);

        // Remove from uploading state after 3 seconds
        setTimeout(() => {
          setUploadingFiles(current => {
            const updated = new Map(current);
            updated.delete(fullKey);
            return updated;
          });
        }, 3000);

      } catch (error) {
        console.error('Upload error:', error);
        addToast('error', 'Upload Failed', `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        newUploadingFiles.set(fullKey, { 
          file, 
          progress: 0, 
          status: 'error' 
        });
        setUploadingFiles(new Map(newUploadingFiles));

        // Remove error state after 5 seconds
        setTimeout(() => {
          setUploadingFiles(current => {
            const updated = new Map(current);
            updated.delete(fullKey);
            return updated;
          });
        }, 5000);
      }
    }

    // Refresh file list after uploads
    setTimeout(() => {
      fetchFiles();
    }, 2000);
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
          acc.push({
            ...node,
            children: filteredChildren
          });
          
          // Auto-expand folders that contain matches
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "text-gray-600 dark:text-gray-400";
    
    switch (extension) {
      case 'pdf':
        return <File className={`${iconClass} text-red-500`} size={18} />;
      case 'doc':
      case 'docx':
        return <File className={`${iconClass} text-blue-500`} size={18} />;
      case 'xls':
      case 'xlsx':
        return <File className={`${iconClass} text-green-500`} size={18} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <File className={`${iconClass} text-purple-500`} size={18} />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <File className={`${iconClass} text-pink-500`} size={18} />;
      case 'zip':
      case 'rar':
        return <File className={`${iconClass} text-yellow-500`} size={18} />;
      default:
        return <File className={iconClass} size={18} />;
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = depth * 24;
    const isHighlighted = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isDraggedOver = dragOver === node.path;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`
            group flex items-center py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50
            cursor-pointer transition-all duration-200 ease-in-out
            border-l-2 border-transparent hover:border-blue-400
            ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' : ''}
            ${isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}
          `}
          style={{ paddingLeft: paddingLeft + 16 }}
          onClick={() => node.type === 'folder' && toggleFolder(node.path)}
          onDragOver={node.type === 'folder' ? (e) => handleDragOver(e, node.path) : undefined}
          onDragLeave={node.type === 'folder' ? handleDragLeave : undefined}
          onDrop={node.type === 'folder' ? (e) => handleDrop(e, node.path) : undefined}
        >
          <div className="flex items-center flex-1 min-w-0 relative">
            {isDraggedOver && node.type === 'folder' && (
              <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center z-10">
                <div className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center">
                  <Upload size={16} className="mr-2" />
                  Drop files here to upload to {node.name}
                </div>
              </div>
            )}

            {node.type === 'folder' && (
              <div className="mr-2 text-gray-500 transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            )}
            
            <div className="mr-3 transition-colors duration-200">
              {node.type === 'folder' ? (
                isExpanded ? (
                  <FolderOpen className="text-blue-600 dark:text-blue-400" size={20} />
                ) : (
                  <Folder className="text-blue-600 dark:text-blue-400" size={20} />
                )
              ) : (
                getFileIcon(node.name)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${
                isHighlighted ? 'font-semibold' : ''
              }`}>
                {node.name}
              </div>
              {node.type === 'file' && (
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {node.size !== undefined && (
                    <div className="flex items-center">
                      <HardDrive size={12} className="mr-1" />
                      {formatFileSize(node.size)}
                    </div>
                  )}
                  {node.lastModified && (
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(node.lastModified)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {node.type === 'folder' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileUpload(node.path);
                  }}
                  title="Upload files to this folder"
                >
                  <Upload size={16} />
                </Button>
              )}
              
              {node.type === 'file' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add download functionality here
                    console.log('Download:', node.path);
                  }}
                  title="Download file"
                >
                  <Download size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

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

  if (loading) {
    return (
      <>
        {/* <ToastContainer toasts={toasts} onClose={removeToast} /> */}
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading your files...</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* <ToastContainer toasts={toasts} onClose={removeToast} /> */}
      <Card className="w-full relative">
        {dragOver === '' && (
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-50">
            <div className="text-blue-600 dark:text-blue-400 text-lg font-medium flex items-center">
              <Upload size={24} className="mr-3" />
              Drop files here to upload to root directory
            </div>
          </div>
        )}
        
        <div
          onDragOver={(e) => handleDragOver(e, '')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, '')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <Folder className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
                  File Explorer
                  {demoMode && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md">
                      Demo Mode
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {stats.files} files • {stats.folders} folders • {formatFileSize(stats.totalSize)}
                  {error && !demoMode && (
                    <span className="block text-red-500 text-sm mt-1">
                      Error: {error}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => triggerFileUpload('')}
                  disabled={demoMode}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload Files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDemoMode(!demoMode);
                    fetchFiles();
                  }}
                  className="flex items-center gap-2"
                >
                  {demoMode ? 'Live Mode' : 'Demo Mode'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchFiles()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
              <Home size={16} />
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <ChevronRight size={14} />}
                  <button
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => setCurrentPath(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto border-t">
              {/* Upload Progress Section */}
              {uploadingFiles.size > 0 && (
                <div className="border-b bg-gray-50 dark:bg-gray-900/50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Upload size={16} className="mr-2" />
                      Uploading Files ({uploadingFiles.size})
                    </h3>
                    <div className="space-y-2">
                      {Array.from(uploadingFiles.entries()).map(([key, upload]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className={`mr-2 ${
                              upload.status === 'success' ? 'text-green-500' : 
                              upload.status === 'error' ? 'text-red-500' : 
                              'text-blue-500'
                            }`}>
                              {upload.status === 'success' ? (
                                <Check size={16} />
                              ) : upload.status === 'error' ? (
                                <X size={16} />
                              ) : (
                                <Upload size={16} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {upload.file.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {key} • {formatFileSize(upload.file.size)}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center">
                            {upload.status === 'uploading' && (
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                  style={{ width: `${upload.progress}%` }}
                                />
                              </div>
                            )}
                            {upload.status === 'success' && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Uploaded
                              </span>
                            )}
                            {upload.status === 'error' && (
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File List */}
              {filteredFileStructure.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredFileStructure.map((node) => renderFileNode(node))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
                  <Folder size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {searchTerm ? 'No matching files found' : 'No files found'}
                  </p>
                  <p className="text-sm text-center max-w-md">
                    {searchTerm 
                      ? `Try adjusting your search term "${searchTerm}" to find what you're looking for.`
                      : 'Your S3 bucket appears to be empty or the files are loading.'
                    }
                  </p>
                  {!demoMode && filteredFileStructure.length === 0 && (
                    <Button
                      onClick={() => triggerFileUpload('')}
                      className="mt-4 flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Upload First File
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
