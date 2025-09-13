import { ChatInterface } from '@/components/ai-chat/ChatInterface';
import { DomainSelector } from '@/components/ai-chat/DomainSelector';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Domain AI Assistant | Scout Dashboard',
  description: 'Natural language analysis across Scout, CES, and Documentation domains'
};

export default function AIchatPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Multi-Domain AI Assistant</h1>
        <p className="text-gray-600 mt-2">
          Ask questions across Scout (retail), CES (creative effectiveness), and Documentation domains.
          Our intelligent router will find the right answers from the appropriate data source.
        </p>
        
        <div className="mt-4">
          <DomainSelector />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-3">
          <div className="h-[600px]">
            <ChatInterface />
          </div>
        </div>
        
        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction
                title="Sales Analysis"
                description="Analyze sales performance by region and brand"
                prompt="Show me sales performance by region for the last 30 days"
              />
              <QuickAction
                title="Top Products"
                description="Find best performing products"
                prompt="What are the top 10 best selling products this month?"
              />
              <QuickAction
                title="Regional Trends"
                description="Explore regional sales patterns"
                prompt="Compare sales trends across different regions"
              />
              <QuickAction
                title="Brand Performance"
                description="Analyze brand metrics"
                prompt="How are our top brands performing compared to last month?"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tips</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Ask specific questions about sales, brands, or regions
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Use date ranges for time-based analysis
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Scout AI can execute SQL queries safely
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Try "hybrid" mode for best results
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, prompt }: {
  title: string;
  description: string;
  prompt: string;
}) {
  return (
    <button
      onClick={() => {
        // Trigger chat with this prompt
        const event = new CustomEvent('scout-ai-prompt', { detail: { prompt } });
        window.dispatchEvent(event);
      }}
      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  );
}