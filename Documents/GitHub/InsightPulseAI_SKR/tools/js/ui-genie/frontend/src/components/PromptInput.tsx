import { useState } from 'react';
import { useUIPromptStore } from '../store/useUIPromptStore';
import { generateUI } from '../utils/api';

export default function PromptInput() {
  const { 
    currentPrompt, 
    setCurrentPrompt, 
    setGeneratingState, 
    setGeneratedUI,
    isGenerating
  } = useUIPromptStore();

  const [error, setError] = useState<string | null>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentPrompt(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setError(null);
      setGeneratingState(true);
      
      // No need for try/catch here since generateUI already handles errors
      const res = await generateUI(currentPrompt);
      setGeneratedUI(res.ui_code);
    } catch (err) {
      // This shouldn't be reached since generateUI handles errors internally
      // But we'll keep it as a double safety
      setError('Failed to generate UI. Please try again.');
      console.error('Unexpected error:', err);
    } finally {
      setGeneratingState(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Magic Patterns</h2>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <label htmlFor="prompt" className="text-sm font-medium mb-1">
            Describe your UI
          </label>
          <textarea
            id="prompt"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
            placeholder="E.g. A pricing page with 3 tiers (Basic, Pro, Enterprise) with a toggle for monthly/yearly pricing..."
            value={currentPrompt}
            onChange={handlePromptChange}
            disabled={isGenerating}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !currentPrompt.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium disabled:bg-blue-400 hover:bg-blue-700 transition-colors flex-grow"
          >
            {isGenerating ? 'Generating...' : 'Generate UI'}
          </button>
          
          <button
            onClick={() => setCurrentPrompt('')}
            disabled={isGenerating || !currentPrompt}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}