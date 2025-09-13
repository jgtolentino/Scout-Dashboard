import { useState } from 'react';
import { useUIPromptStore } from '../store/useUIPromptStore';

export default function SavedLibrary() {
  const { savedUIs, loadSavedUI, deleteSavedUI } = useUIPromptStore();
  const [expanded, setExpanded] = useState(false);

  if (savedUIs.length === 0) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncatePrompt = (prompt: string, maxLength = 80) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength) + '...';
  };

  return (
    <div className="w-full mt-8">
      <div 
        className="flex justify-between items-center cursor-pointer mb-2"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold">Saved Designs ({savedUIs.length})</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>
      
      {expanded && (
        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {savedUIs.map((ui) => (
              <li key={ui.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => loadSavedUI(ui.id)}>
                    <p className="font-medium">{truncatePrompt(ui.prompt)}</p>
                    <p className="text-sm text-gray-500">{formatDate(ui.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => loadSavedUI(ui.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSavedUI(ui.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}