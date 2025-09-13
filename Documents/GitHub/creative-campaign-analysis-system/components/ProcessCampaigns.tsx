'use client';

import { useState } from 'react';
import { Upload, Folder, Play, CheckCircle, AlertCircle } from 'lucide-react';

export function ProcessCampaigns() {
  const [folderId, setFolderId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    if (!folderId.trim()) {
      alert('Please enter a Google Drive folder ID');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/process-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Processing error:', error);
      setResult({
        success: false,
        error: 'Failed to process campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Folder className="mr-2 h-5 w-5" />
          Campaign Folder Processing
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Drive Folder ID
            </label>
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="Enter Google Drive folder ID (e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)"
              className="w-full border rounded px-3 py-2"
              disabled={processing}
            />
            <p className="text-sm text-gray-500 mt-1">
              The folder should contain campaign files (videos, images, presentations, documents)
            </p>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !folderId.trim()}
            className="flex items-center px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Process Campaign
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            {result.success ? (
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            )}
            Processing Results
          </h3>

          {result.success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-medium text-green-800 mb-2">✅ Campaign Processing Completed</h4>
                <p className="text-green-700">{result.message}</p>
                
                {result.stats && (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Files Processed:</span> {result.stats.processed}
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span> {result.stats.errors}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium text-blue-800 mb-2">🎯 What Happened:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Extracted creative features from campaign files</li>
                  <li>• Predicted business outcomes using 25+ outcome models</li>
                  <li>• Analyzed campaign composition and structure</li>
                  <li>• Created embeddings for similarity search</li>
                  <li>• Stored all data in Azure SQL Database</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h4 className="font-medium text-gray-800 mb-2">🚀 Next Steps:</h4>
                <p className="text-gray-700 text-sm">
                  Go to the <strong>Creative Insights</strong> tab to ask strategic questions about your campaigns,
                  or visit <strong>Campaign Analytics</strong> to view detailed performance predictions.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Processing Failed</h4>
              <p className="text-red-700 mb-2">{result.error}</p>
              {result.details && (
                <p className="text-red-600 text-sm">{result.details}</p>
              )}
              
              <div className="mt-3 bg-red-100 rounded p-3">
                <h5 className="font-medium text-red-800 text-sm mb-1">Troubleshooting:</h5>
                <ul className="text-red-700 text-xs space-y-1">
                  <li>• Check that the Google Drive folder ID is correct</li>
                  <li>• Verify the folder contains campaign files</li>
                  <li>• Ensure Google Drive API credentials are configured</li>
                  <li>• Check Azure SQL Database connectivity</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          How Campaign Processing Works
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">📊 Creative Features (30+)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Content: Value proposition, urgency, social proof</li>
              <li>• Design: Visual hierarchy, motion graphics, color</li>
              <li>• Messaging: Action-oriented language, clarity</li>
              <li>• Targeting: Behavioral precision, segmentation</li>
              <li>• Channel: Cross-platform optimization</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🎯 Business Outcomes (25+)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Engagement: High engagement, viral potential</li>
              <li>• Conversion: Direct sales, lead generation</li>
              <li>• Brand: Recall, equity lift, differentiation</li>
              <li>• Efficiency: Media optimization, ROI</li>
              <li>• Behavioral: Purchase intent, advocacy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}