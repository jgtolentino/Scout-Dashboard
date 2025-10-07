import React, { useState, useEffect } from 'react';
import { getPremiumInsights } from '../api/premium';

interface PremiumInsights {
  headline: string;
  bullets: string[];
  recommendation: string;
}

export const PremiumInsightsCard: React.FC = () => {
  const [insights, setInsights] = useState<PremiumInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const data = await getPremiumInsights();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load premium insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded mb-4"></div>
          <div className="h-3 bg-white/30 rounded mb-2"></div>
          <div className="h-3 bg-white/30 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return null; // Hide card for non-premium users
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg shadow-lg text-white">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🤖</span>
        <h3 className="text-lg font-bold">AI-Powered Insights</h3>
        <span className="ml-auto bg-white/20 px-2 py-1 rounded text-xs">Premium</span>
      </div>
      
      <h4 className="text-xl font-semibold mb-3">{insights.headline}</h4>
      
      <ul className="mb-4 space-y-1">
        {insights.bullets.map((bullet, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span className="text-sm">{bullet}</span>
          </li>
        ))}
      </ul>
      
      <div className="bg-white/10 p-3 rounded">
        <p className="text-sm">
          <strong>Recommendation:</strong> {insights.recommendation}
        </p>
      </div>
    </div>
  );
};