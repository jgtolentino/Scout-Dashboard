import axios from 'axios';

export interface PremiumInsights {
  headline: string;
  bullets: string[];
  recommendation: string;
}

export async function getPremiumInsights(): Promise<PremiumInsights | null> {
  try {
    const response = await axios.get('/api/premium-insights');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      // User is not premium - return null to hide the card
      return null;
    }
    throw new Error('Failed to fetch premium insights');
  }
}