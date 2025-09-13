import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileArchive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { formatBytes } from '../../utils/format';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  uploadId?: string;
  error?: string;
}

interface ZipUploadProps {
  onUploadComplete?: (uploadId: string) => void;
  source?: string;
  className?: string;
}

export const ZipUpload: React.FC<ZipUploadProps> = ({
  onUploadComplete,
  source = 'manual',
  className = ''
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'pending' as const
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'multipart/x-zip': ['.zip']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' } 
          : f
      ));

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('source', source);
      formData.append('processImmediately', 'true');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const result = await response.json();

      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'processing',
              uploadId: result.data.uploadId 
            } 
          : f
      ));

      // Poll for processing status
      pollUploadStatus(uploadFile.id, result.data.uploadId);

      return result.data.uploadId;
    } catch (error) {
      console.error('Upload error:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            } 
          : f
      ));
      
      toast.error(`Failed to upload ${uploadFile.file.name}`);
      throw error;
    }
  };

  const pollUploadStatus = async (fileId: string, uploadId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/upload/${uploadId}/status`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        });

        if (!response.ok) throw new Error('Status check failed');

        const result = await response.json();
        const status = result.data.status;

        if (status === 'completed' || status === 'completed_with_errors') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' } 
              : f
          ));
          
          toast.success(`Processing complete for ${result.data.filename}`);
          onUploadComplete?.(uploadId);
          
        } else if (status === 'failed') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'error',
                  error: result.data.error_message || 'Processing failed'
                } 
              : f
          ));
          
          toast.error(`Processing failed for ${result.data.filename}`);
          
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          throw new Error('Processing timeout');
        }
      } catch (error) {
        console.error('Status check error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'error',
                error: 'Status check failed'
              } 
            : f
        ));
      }
    };

    checkStatus();
  };

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const file of pendingFiles) {
      try {
        await uploadFile(file);
      } catch (error) {
        // Error handled in uploadFile
      }
    }

    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileArchive className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing files...';
      case 'completed':
        return 'Completed';
      case 'error':
        return file.error || 'Error';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg text-blue-600 dark:text-blue-400">
            Drop the ZIP files here...
          </p>
        ) : (
          <>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              Drag & drop ZIP files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Maximum file size: 100MB. Supports CSV, Excel, JSON files inside ZIP.
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Files ({files.length})</h3>
            <div className="space-x-2">
              {files.some(f => f.status === 'completed') && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear completed
                </button>
              )}
              {files.some(f => f.status === 'pending') && (
                <button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(file.file.size)} • {getStatusText(file)}
                    </p>
                  </div>
                </div>
                
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};