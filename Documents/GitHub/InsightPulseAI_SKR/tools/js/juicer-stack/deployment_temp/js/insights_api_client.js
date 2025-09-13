/**
 * Retail Advisor GenAI Insights API Client
 * Provides a consistent interface for all dashboards to access insights data
 */
class InsightsAPIClient {
  constructor(baseUrl = '/api/insights') {
    this.baseUrl = baseUrl;
  }

  async getInsights(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  }

  async getInsightStats() {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Failed to fetch insight stats');
    return response.json();
  }

  async generateInsights(params = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to generate insights');
    return response.json();
  }
}

// Create global instance
const insightsClient = new InsightsAPIClient();
