import PromptInput from '../components/PromptInput';
import LivePreview from '../components/LivePreview';
import SavedLibrary from '../components/SavedLibrary';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Magic Patterns</h1>
          <p className="text-gray-600">
            Generate beautiful UI components with AI
          </p>
        </header>
        
        <div className="grid grid-cols-1 gap-8">
          <PromptInput />
          <LivePreview />
          <SavedLibrary />
        </div>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 Magic Patterns — AI-Driven UI/UX Generator</p>
        </footer>
      </div>
    </div>
  );
}