import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Plus } from 'lucide-react';
import useDataStore from '@/store/dataStore';
import { handleFileUpload, exportToCSV, exportToJSON, exportToExcel } from '@/utils/fileHandlers';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DataManager() {
  const { datasets, addDataset, deleteDataset, setActiveDataset } = useDataStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataset = await handleFileUpload(file);
      addDataset(dataset);
      toast.success(`Successfully imported ${dataset.name}`);
    } catch (error) {
      toast.error(`Failed to import file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = (datasetId: string, format: 'csv' | 'json' | 'excel') => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    try {
      switch (format) {
        case 'csv':
          exportToCSV(dataset);
          break;
        case 'json':
          exportToJSON(dataset);
          break;
        case 'excel':
          exportToExcel(dataset);
          break;
      }
      toast.success(`Exported ${dataset.name} as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export: ${error.message}`);
    }
  };

  const handleDelete = (datasetId: string) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      deleteDataset(datasetId);
      toast.success('Dataset deleted successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-600 mt-1">Import, manage, and export your datasets</p>
        </div>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-dashboard-500 text-white rounded-lg hover:bg-dashboard-600 transition-colors cursor-pointer">
          <Upload size={18} />
          Import Data
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFile}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className={`
              dashboard-card cursor-pointer transition-all
              ${selectedDataset === dataset.id ? 'ring-2 ring-dashboard-500' : ''}
            `}
            onClick={() => setSelectedDataset(dataset.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-dashboard-100 rounded-lg">
                  <FileText className="text-dashboard-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                  <p className="text-sm text-gray-500">
                    {dataset.data.length} rows • {dataset.columns.length} columns
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>Created: {format(new Date(dataset.createdAt), 'MMM dd, yyyy')}</p>
              <p>Updated: {format(new Date(dataset.updatedAt), 'MMM dd, yyyy')}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDataset(dataset.id);
                  toast.success('Dataset activated');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Eye size={16} />
                View
              </button>
              
              <div className="relative group">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(dataset.id, 'csv');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(dataset.id, 'json');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(dataset.id, 'excel');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    Export as Excel
                  </button>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(dataset.id);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Add Dataset Card */}
        <label className="dashboard-card border-2 border-dashed border-gray-300 hover:border-dashboard-500 cursor-pointer transition-colors flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Plus size={48} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Import New Dataset</p>
            <p className="text-sm text-gray-500 mt-1">CSV, Excel, or JSON</p>
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFile}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Dataset Preview */}
      {selectedDataset && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dataset Preview</h2>
          <div className="dashboard-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {datasets
                      .find(d => d.id === selectedDataset)
                      ?.columns.slice(0, 8)
                      .map(col => (
                        <th key={col}>{col}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets
                    .find(d => d.id === selectedDataset)
                    ?.data.slice(0, 10)
                    .map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).slice(0, 8).map((val, colIdx) => (
                          <td key={colIdx}>
                            {typeof val === 'number' 
                              ? val.toLocaleString() 
                              : String(val).length > 50 
                                ? String(val).substring(0, 50) + '...'
                                : String(val)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
              Showing first 10 rows of {datasets.find(d => d.id === selectedDataset)?.data.length} total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}