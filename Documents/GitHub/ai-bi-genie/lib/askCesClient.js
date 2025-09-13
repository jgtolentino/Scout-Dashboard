/**
 * Ask CES AI Client SDK
 * Centralized client for interacting with Ask CES AI backend
 */

class AskCesClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_ASK_CES_API_URL || 'http://localhost:8080/api/ces/v1';
    this.apiKey = config.apiKey || process.env.ASK_CES_API_KEY;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make authenticated request to Ask CES API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CES-Platform': 'Ask CES v3.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      timeout: this.timeout
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`Ask CES API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          endpoint,
          platform: 'Ask CES'
        }
      };
    } catch (error) {
      console.error('Ask CES API request failed:', error);
      return {
        success: false,
        error: error.message,
        meta: {
          timestamp: new Date().toISOString(),
          endpoint,
          platform: 'Ask CES'
        }
      };
    }
  }

  /**
   * Generate dynamic tutorial steps based on context
   */
  async generateTutorial({ context, userLevel = 'beginner', language = 'en' }) {
    const response = await this.makeRequest('/ask', {
      method: 'POST',
      body: JSON.stringify({
        query: `Generate an interactive tutorial for context: ${context}`,
        context: {
          type: 'tutorial_generation',
          userLevel,
          language,
          platform: 'web'
        },
        format: 'structured_steps'
      })
    });

    if (response.success) {
      // Transform CES response into tutorial steps format
      return this.formatTutorialSteps(response.data, context);
    } else {
      // Fallback to static steps if AI fails
      return this.getFallbackTutorial(context);
    }
  }

  /**
   * Ask CES a natural language question
   */
  async ask(query, context = {}) {
    return await this.makeRequest('/ask', {
      method: 'POST',
      body: JSON.stringify({
        query,
        context: {
          ...context,
          timestamp: new Date().toISOString()
        }
      })
    });
  }

  /**
   * Get AI-powered insights
   */
  async getInsights(dataContext = {}) {
    return await this.makeRequest('/insights', {
      method: 'POST',
      body: JSON.stringify({
        dataContext,
        analysisType: 'comprehensive',
        includeRecommendations: true
      })
    });
  }

  /**
   * Get system pulse/health metrics
   */
  async getPulse() {
    return await this.makeRequest('/pulse');
  }

  /**
   * Get strategic recommendations
   */
  async getStrategies(businessContext = {}) {
    return await this.makeRequest('/strategies', {
      method: 'POST',
      body: JSON.stringify({
        businessContext,
        timeHorizon: '3months',
        includeActionItems: true
      })
    });
  }

  /**
   * Format AI response into tutorial steps
   */
  formatTutorialSteps(cesResponse, context) {
    try {
      // Parse CES AI response and convert to tutorial format
      const aiSteps = cesResponse.steps || cesResponse.tutorial || [];
      
      return aiSteps.map((step, index) => ({
        id: `ces_step_${index + 1}`,
        title: step.title || `Step ${index + 1}`,
        description: step.description || step.content,
        action: step.action || 'observe',
        target: step.target || null,
        highlight: step.highlight || false,
        interactive: step.interactive !== false,
        duration: step.duration || 5000,
        cesGenerated: true,
        context
      }));
    } catch (error) {
      console.error('Error formatting CES tutorial steps:', error);
      return this.getFallbackTutorial(context);
    }
  }

  /**
   * Fallback tutorial when AI is unavailable
   */
  getFallbackTutorial(context) {
    const fallbackTutorials = {
      'dashboard_overview': [
        {
          id: 'fallback_1',
          title: 'Welcome to Ask CES',
          description: 'Ask CES is your Centralized Enterprise System for intelligent insights.',
          action: 'observe',
          duration: 4000
        },
        {
          id: 'fallback_2', 
          title: 'Explore the Dashboard',
          description: 'Navigate through different sections to discover AI-powered analytics.',
          action: 'navigate',
          duration: 5000
        },
        {
          id: 'fallback_3',
          title: 'Ask CES Anything',
          description: 'Use natural language to query your business data.',
          action: 'interact',
          duration: 6000
        }
      ],
      'ask_ces_tutorial': [
        {
          id: 'ces_intro_1',
          title: 'Ask CES - Your AI Assistant',
          description: 'Ask CES can understand natural language queries about your business data.',
          action: 'observe',
          duration: 5000
        },
        {
          id: 'ces_intro_2',
          title: 'Try a Sample Query',
          description: 'Ask something like "What are our top performing products this quarter?"',
          action: 'interact',
          target: '#ces-query-input',
          duration: 8000
        },
        {
          id: 'ces_intro_3',
          title: 'Get Intelligent Insights',
          description: 'CES will analyze your data and provide actionable recommendations.',
          action: 'observe',
          duration: 6000
        }
      ]
    };

    return fallbackTutorials[context] || fallbackTutorials['dashboard_overview'];
  }

  /**
   * Track tutorial interaction for AI learning
   */
  async trackTutorialInteraction(stepId, action, context) {
    try {
      await this.makeRequest('/pulse', {
        method: 'POST',
        body: JSON.stringify({
          event: 'tutorial_interaction',
          stepId,
          action,
          context,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Silent fail for analytics
      console.debug('Tutorial tracking failed:', error);
    }
  }
}

// Export singleton instance
const askCesClient = new AskCesClient();
export default askCesClient;

// Also export the class for custom instances
export { AskCesClient };