import React, { useState, useEffect } from 'react';
import { ZipUpload } from '../components/ZipUpload';
import { supabase } from '../lib/supabase';
import { formatBytes, formatDate } from '../utils/format';
import { FileArchive, CheckCircle, AlertCircle, Clock, Download, Trash2 } from 'lucide-react';

interface UploadHistory {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  upload_date: string;
  processed_at?: string;
  extractedFileCount?: number;
  error_message?: string;
}

export const DataImport: React.FC = () => {
  const [uploads, setUploads] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalSize: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalFilesExtracted: 0,
    totalCampaignsImported: 0,
    totalMetricsImported: 0
  });

  useEffect(() => {
    loadUploadHistory();
    loadStats();
  }, []);

  const loadUploadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v5/uploads?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUploads(result.data.uploads);
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase.rpc('get_upload_stats', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (data) {
        setStats({
          totalUploads: data.total_uploads || 0,
          totalSize: data.total_size || 0,
          successfulUploads: data.successful_uploads || 0,
          failedUploads: data.failed_uploads || 0,
          totalFilesExtracted: data.total_files_extracted || 0,
          totalCampaignsImported: data.total_campaigns_imported || 0,
          totalMetricsImported: data.total_metrics_imported || 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUploadComplete = (uploadId: string) => {
    // Reload data after successful upload
    loadUploadHistory();
    loadStats();
  };

  const deleteUpload = async (uploadId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/v5/upload/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        loadUploadHistory();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to delete upload:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed_with_errors':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileArchive className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'completed_with_errors':
        return 'Completed with errors';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Uploaded';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Import</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload ZIP files containing your campaign data in CSV, Excel, or JSON format
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Uploads</p>
              <p className="text-2xl font-bold">{stats.totalUploads}</p>
            </div>
            <FileArchive className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
              <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
            </div>
            <Download className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Files Extracted</p>
              <p className="text-2xl font-bold">{stats.totalFilesExtracted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold">
                {stats.totalUploads > 0 
                  ? Math.round((stats.successfulUploads / stats.totalUploads) * 100) 
                  : 0}%
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Upload Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Files</h2>
        <ZipUpload 
          onUploadComplete={handleUploadComplete}
          source="dashboard"
        />
      </div>

      {/* Upload History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Upload History</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : uploads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No uploads yet. Upload your first ZIP file to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Extracted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(upload.status)}
                        <span className="ml-2 text-sm">{getStatusText(upload.status)}</span>
                      </div>
                      {upload.error_message && (
                        <p className="text-xs text-red-500 mt-1">{upload.error_message}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {upload.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBytes(upload.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.extractedFileCount || 0} files
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(upload.upload_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deleteUpload(upload.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};