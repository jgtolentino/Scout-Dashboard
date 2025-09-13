'use client';

import { useState } from 'react';
import { Send, Filter, Target, BarChart3, Lightbulb } from 'lucide-react';

interface CreativeInsightResult {
  answer: string;
  sources: Array<{
    content: string;
    source: string;
    campaign: string;
    client: string;
    creative_features: any;
    business_outcomes: any;
  }>;
  analysis: any[];
  metadata: {
    query: string;
    resultsCount: number;
  };
}

export function CreativeInsightsComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CreativeInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    campaign: '',
    client: '',
    creative_feature: '',
    business_outcome: ''
  });

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/creative-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, filters })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Query error:', error);
      alert('Error processing creative insights query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Which creative features drive highest engagement?",
    "What messaging strategies work best for brand outcomes?", 
    "Show me video-heavy campaigns with strong conversion potential",
    "Which targeting approaches predict best business results?",
    "What design features correlate with positive brand sentiment?"
  ];

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Creative Strategy Insights
        </h3>
        
        {/* Advanced Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={filters.campaign}
            onChange={(e) => setFilters({...filters, campaign: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Campaigns</option>
            <option value="brand_launch">Brand Launch</option>
            <option value="product_campaign">Product Campaign</option>
            <option value="seasonal">Seasonal Campaign</option>
          </select>
          
          <select
            value={filters.client}
            onChange={(e) => setFilters({...filters, client: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Clients</option>
            <option value="automotive">Automotive</option>
            <option value="tech">Technology</option>
            <option value="fmcg">FMCG</option>
          </select>
          
          <select
            value={filters.creative_feature}
            onChange={(e) => setFilters({...filters, creative_feature: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Features</option>
            <option value="storytelling">Storytelling</option>
            <option value="emotional_appeal">Emotional Appeal</option>
            <option value="call_to_action">Call to Action</option>
          </select>
          
          <select
            value={filters.business_outcome}
            onChange={(e) => setFilters({...filters, business_outcome: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Outcomes</option>
            <option value="engagement">Engagement</option>
            <option value="conversion">Conversion</option>
            <option value="brand">Brand Building</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about creative strategies, campaign effectiveness, business outcomes..."
            className="flex-1 border rounded px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
        </div>

        {/* Sample Queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Try these strategic questions:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, index) => (
              <button
                key={index}
                onClick={() => setQuery(sample)}
                className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* AI Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Strategic Analysis
            </h3>
            
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium mb-2">Creative Strategy Insights:</h4>
              <p className="text-gray-700">{result.answer}</p>
            </div>
          </div>

          {/* Campaign Sources */}
          {result.sources.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Campaign Evidence ({result.sources.length})
              </h3>
              
              <div className="space-y-4">
                {result.sources.map((source, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-medium">{source.source}</span>
                        <div className="text-sm text-gray-500">
                          Campaign: {source.campaign} • Client: {source.client}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{source.content.substring(0, 300)}...</p>
                    
                    {/* Creative Features */}
                    {source.creative_features && Object.keys(source.creative_features).length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Detected Creative Features:</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(source.creative_features)
                            .filter(([key, value]) => value === true)
                            .slice(0, 6)
                            .map(([key]) => (
                              <span key={key} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {key.replace(/_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Business Outcomes */}
                    {source.business_outcomes && Object.keys(source.business_outcomes).length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Predicted Outcomes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(source.business_outcomes)
                            .filter(([key, value]) => value === true)
                            .slice(0, 6)
                            .map(([key]) => (
                              <span key={key} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {key.replace(/outcome_|_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}