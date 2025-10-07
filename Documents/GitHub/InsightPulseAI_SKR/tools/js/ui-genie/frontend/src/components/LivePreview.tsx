import { useState, useEffect, useRef } from 'react';
import { useUIPromptStore } from '../store/useUIPromptStore';

export default function LivePreview() {
  const { generatedUI, saveCurrentUI } = useUIPromptStore();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopyCode = () => {
    if (!generatedUI) return;
    
    navigator.clipboard.writeText(generatedUI);
    setCopied(true);
  };

  const handleSave = () => {
    if (!generatedUI) return;
    saveCurrentUI();
  };

  // If no UI has been generated yet
  if (!generatedUI) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-300 p-6 min-h-[300px] flex items-center justify-center text-gray-500">
        Your generated UI will appear here
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Generated UI</h3>
        
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'preview' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'code' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setViewMode('code')}
            >
              Code
            </button>
          </div>
          
          <button
            onClick={handleCopyCode}
            className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          
          <button
            onClick={handleSave}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="w-full bg-white rounded-lg border border-gray-300 overflow-hidden">
        {viewMode === 'preview' ? (
          // Preview Mode
          <div 
            ref={previewRef}
            className="p-6 min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: generatedUI }}
          />
        ) : (
          // Code Mode
          <div className="overflow-x-auto">
            <pre className="p-4 bg-gray-50 text-gray-800 text-sm whitespace-pre-wrap">
              {generatedUI}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}