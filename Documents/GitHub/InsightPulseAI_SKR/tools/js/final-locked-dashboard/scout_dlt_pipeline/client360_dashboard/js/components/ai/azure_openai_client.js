/**
 * Azure OpenAI Client - Client360 Dashboard v2.3.3
 * Handles all interactions with Azure OpenAI API for AI Insights generation
 */

class AzureOpenAIClient {
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || 'https://tbwa-ai-insights.openai.azure.com';
    this.apiVersion = config.apiVersion || '2023-05-15';
    this.deploymentName = config.deploymentName || 'client360-insights';
    this.apiKey = config.apiKey || this.getApiKey();
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 15000; // 15 seconds timeout
  }

  /**
   * Get API key from environment or config
   * In production, this would use proper secret management
   */
  getApiKey() {
    // In a real implementation, this would securely retrieve the key
    // For development, we'll check if a key is set in sessionStorage
    const devKey = sessionStorage.getItem('azure_openai_key');
    if (devKey) {
      return devKey;
    }
    
    // Return a placeholder - in production deployment this would be properly handled
    // through secure environment variables or a key vault
    console.warn('No Azure OpenAI API key found. Using placeholder for development.');
    return 'AZURE_OPENAI_KEY_PLACEHOLDER';
  }

  /**
   * Generate AI insights for sales data
   * @param {Object} data - The sales data to analyze
   * @param {string} insightType - Type of insight to generate (sales, brand, recommendation)
   * @returns {Promise<Object>} - Generated insights
   */
  async generateInsights(data, insightType = 'sales') {
    try {
      // Prepare the prompt based on insight type
      const prompt = this.preparePrompt(data, insightType);
      
      // Call Azure OpenAI API
      const response = await this.callAzureOpenAI(prompt);
      
      // Process and format the response
      return this.processResponse(response, insightType, data);
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error(`Failed to generate ${insightType} insights: ${error.message}`);
    }
  }

  /**
   * Prepare prompt based on data and insight type
   * @param {Object} data - The data to analyze
   * @param {string} insightType - Type of insight to generate
   * @returns {string} - Formatted prompt
   */
  preparePrompt(data, insightType) {
    let promptTemplate = '';
    
    // Select prompt template based on insight type
    switch (insightType) {
      case 'sales':
        promptTemplate = this.getSalesPrompt();
        break;
      case 'brand':
        promptTemplate = this.getBrandPrompt();
        break;
      case 'recommendation':
        promptTemplate = this.getRecommendationPrompt();
        break;
      default:
        promptTemplate = this.getSalesPrompt();
    }
    
    // Replace placeholders with actual data
    // In a real implementation, this would be more sophisticated
    return promptTemplate.replace('{{DATA}}', JSON.stringify(data));
  }

  /**
   * Call Azure OpenAI API
   * @param {string} prompt - The prompt to send
   * @returns {Promise<Object>} - API response
   */
  async callAzureOpenAI(prompt) {
    const url = `${this.apiEndpoint}/openai/deployments/${this.deploymentName}/completions?api-version=${this.apiVersion}`;
    
    const payload = {
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify(payload)
    };
    
    let retries = 0;
    let lastError = null;
    
    while (retries < this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, { 
          ...options,
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        retries++;
        
        // Exponential backoff
        if (retries < this.maxRetries) {
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed to call Azure OpenAI API after multiple retries');
  }

  /**
   * Process and format API response into insight object
   * @param {Object} response - Raw API response
   * @param {string} insightType - Type of insight
   * @param {Object} sourceData - Original data that was analyzed
   * @returns {Object} - Formatted insight
   */
  processResponse(response, insightType, sourceData) {
    try {
      // Extract the generated text
      const completionText = response.choices[0]?.text || '';
      
      // Parse the JSON response - with error handling
      let insightData;
      try {
        // First try to parse as JSON directly
        insightData = JSON.parse(completionText.trim());
      } catch (parseError) {
        // If that fails, try to extract JSON from the text
        const jsonMatch = completionText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            insightData = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error('Failed to extract JSON from response:', extractError);
            throw new Error('Invalid JSON format in AI response');
          }
        } else {
          throw parseError;
        }
      }
      
      // Transform to standard insight format
      return this.transformToInsightFormat(insightData, insightType, sourceData);
    } catch (error) {
      console.error('Error processing AI response:', error);
      throw new Error(`Failed to process ${insightType} insights: ${error.message}`);
    }
  }

  /**
   * Transform API response to standard insight format
   * @param {Object} data - Parsed response data
   * @param {string} insightType - Type of insight
   * @param {Object} sourceData - Original source data
   * @returns {Object} - Standardized insight object
   */
  transformToInsightFormat(data, insightType, sourceData) {
    // Generate a unique ID for this insight
    const insightId = `INS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Map insight type to category
    const categoryMap = {
      'sales': 'sales_insights',
      'brand': 'brand_analysis',
      'recommendation': 'store_recommendations'
    };
    
    // Create the base insight object with common fields
    const insight = {
      category: categoryMap[insightType] || categoryMap.sales,
      InsightID: insightId,
      entityID: sourceData.entityID || 'unknown',
      entityName: sourceData.entityName || 'Unknown Entity',
      region: sourceData.region || 'All Regions',
      cityMunicipality: sourceData.cityMunicipality || 'All Areas',
      GeneratedAt: new Date().toISOString(),
      title: data.title || 'AI Generated Insight',
      summary: data.summary || 'No summary available',
      content: {
        ...data,
        title: data.title || 'AI Generated Insight',
        summary: data.summary || 'No summary available',
      },
      isSynthetic: false,
      dataSource: 'Real'
    };
    
    // Add type-specific fields
    switch (insightType) {
      case 'sales':
        if (!insight.content.details) {
          insight.content.details = [];
        }
        if (!insight.content.recommendations) {
          insight.content.recommendations = [];
        }
        insight.content.confidence = data.confidence || 0.75;
        insight.content.priority = data.priority || 'medium';
        break;
        
      case 'brand':
        if (!insight.content.sentiment_analysis) {
          insight.content.sentiment_analysis = {
            overall_score: data.overall_score || 0.5,
            interpretation: data.interpretation || 'No interpretation available'
          };
        }
        if (!insight.content.recommendations) {
          insight.content.recommendations = [];
        }
        insight.content.confidence = data.confidence || 0.7;
        insight.content.priority = data.priority || 'medium';
        break;
        
      case 'recommendation':
        if (!insight.content.store_assessment) {
          insight.content.store_assessment = {
            overall_rating: data.overall_rating || 5.0,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || []
          };
        }
        if (!insight.content.action_plan) {
          insight.content.action_plan = data.action_plan || [];
        }
        insight.content.priority = data.priority || 'medium';
        break;
    }
    
    return insight;
  }

  /**
   * Get sales insights prompt template
   * @returns {string} - Prompt template
   */
  getSalesPrompt() {
    return `
You are an AI retail sales analyst for TBWA Client360 Dashboard. Analyze the following sales data and generate actionable insights.

DATA:
{{DATA}}

Generate a detailed sales insight in JSON format with the following structure:
{
  "title": "Brief, specific title that captures the key insight",
  "summary": "One-sentence summary of the key finding and its implication",
  "details": [
    "3-5 specific observations from the data",
    "Include specific metrics and percentages when available",
    "Identify trends, anomalies, or opportunities"
  ],
  "recommendations": [
    "3-5 specific, actionable recommendations based on the insights",
    "Focus on practical steps that can increase sales or optimize operations",
    "Consider the context of sari-sari stores and retail environments"
  ],
  "confidence": 0.85,
  "priority": "high/medium/low based on business impact"
}

Ensure all insights are data-driven, specific, and actionable. Include actual numbers and percentages when available.
`;
  }

  /**
   * Get brand analysis prompt template
   * @returns {string} - Prompt template
   */
  getBrandPrompt() {
    return `
You are an AI brand analyst for TBWA Client360 Dashboard. Analyze the following brand data and generate actionable insights.

DATA:
{{DATA}}

Generate a detailed brand insight in JSON format with the following structure:
{
  "title": "Clear, specific title that captures the key brand insight",
  "summary": "One-sentence summary of the key finding and its brand implication",
  "sentiment_analysis": {
    "overall_score": 0.75,
    "interpretation": "Detailed interpretation of brand sentiment and perception"
  },
  "recommendations": [
    "3-5 specific, actionable brand recommendations",
    "Focus on improving brand positioning, perception, or market share",
    "Consider consumer behavior and competitive landscape"
  ],
  "confidence": 0.8,
  "priority": "high/medium/low based on strategic impact"
}

Focus on brand perception, customer loyalty, market share, and competitive positioning. Be specific and actionable.
`;
  }

  /**
   * Get recommendation prompt template
   * @returns {string} - Prompt template
   */
  getRecommendationPrompt() {
    return `
You are an AI retail consultant for TBWA Client360 Dashboard. Analyze the following store data and generate strategic recommendations.

DATA:
{{DATA}}

Generate a detailed store recommendation in JSON format with the following structure:
{
  "title": "Clear, specific title that summarizes the key recommendation",
  "summary": "One-sentence summary of the recommendation and expected impact",
  "store_assessment": {
    "overall_rating": 7.5,
    "strengths": [
      "3-5 specific store strengths from the data",
      "Focus on competitive advantages and positive metrics"
    ],
    "weaknesses": [
      "3-5 specific areas for improvement",
      "Identify opportunities to increase performance"
    ]
  },
  "action_plan": [
    {
      "action": "Specific action to take",
      "timeline": "Suggested timeline for implementation",
      "expected_outcome": "Quantifiable expected outcome when possible"
    },
    {
      "action": "Second recommended action",
      "timeline": "Implementation timeline",
      "expected_outcome": "Expected business impact"
    }
  ],
  "priority": "high/medium/low based on business impact"
}

Ensure recommendations are specific, practical for retail/sari-sari store environments, and tied to financial or operational improvements.
`;
  }
}

// Export the client
window.AzureOpenAIClient = AzureOpenAIClient;