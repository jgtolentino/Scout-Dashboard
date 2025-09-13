/**
 * useLearnBot React Hook
 * UI integration for LearnBot with adult learning principles
 * Compatible with Scout Dashboard, Ask CES, and Pulser CLI interfaces
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// TypeScript interfaces
interface LearnerProfile {
  userId: string;
  competenceLevel: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
  learningPreferences: {
    style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    pace: 'slow' | 'moderate' | 'fast';
    guidance: 'high' | 'moderate' | 'minimal';
  };
  currentContext: {
    domain: string;
    currentPage: string;
    userRole: string;
  };
}

interface QAResponse {
  answer: string;
  confidence: number;
  sources: string[];
  followUpSuggestions: string[];
  learningTip: string;
}

interface Walkthrough {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: string;
  steps: WalkthroughStep[];
  navigation: {
    allowSkip: boolean;
    adaptiveBranching: boolean;
    progressSaving: boolean;
  };
}

interface WalkthroughStep {
  id: string;
  stage: 'activation' | 'demonstration' | 'application' | 'integration';
  title: string;
  contentType: string;
  estimatedMinutes: number;
  activities: string[];
  isCompleted?: boolean;
  confidence?: number;
}

interface LearnBotState {
  isActive: boolean;
  currentWalkthrough: Walkthrough | null;
  currentStep: number;
  qaHistory: Array<{question: string; answer: QAResponse; timestamp: Date}>;
  learnerProfile: LearnerProfile | null;
  analytics: {
    totalInteractions: number;
    sessionStartTime: Date | null;
    completedWalkthroughs: string[];
    averageConfidence: number;
  };
}

interface UseLearnBotReturn {
  // State
  state: LearnBotState;
  
  // Core Functions (following Merrill's First Principles)
  ask: (question: string, context?: any) => Promise<QAResponse>;
  startWalkthrough: (topic: string, context?: any) => Promise<Walkthrough>;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  
  // Adaptive Support (Knowles' Andragogy)
  getHint: (strugglingWith?: string) => Promise<string>;
  trackProgress: (stepId: string, confidence: number, timeSpent: number) => void;
  updateLearnerProfile: (updates: Partial<LearnerProfile>) => void;
  
  // UI Integration
  toggleLearnBot: () => void;
  showTooltip: (element: HTMLElement, content: string) => void;
  hideTooltip: () => void;
  
  // Analytics (Evidence-based learning)
  getAnalytics: () => Promise<any>;
  exportLearningRecord: () => void;
}

// Default learner profile based on adult learning principles
const createDefaultLearnerProfile = (userId: string, context: any): LearnerProfile => ({
  userId,
  competenceLevel: 'advanced_beginner', // Safe assumption for working adults
  learningPreferences: {
    style: 'visual', // Most effective for dashboard/technical content
    pace: 'moderate',
    guidance: 'moderate' // Adults prefer some structure but not rigid control
  },
  currentContext: {
    domain: context?.domain || 'general',
    currentPage: context?.currentPage || 'unknown',
    userRole: context?.userRole || 'user'
  }
});

// Custom hook implementation
export const useLearnBot = (config?: {
  apiEndpoint?: string;
  userId?: string;
  enableAnalytics?: boolean;
  autoSave?: boolean;
}): UseLearnBotReturn => {
  
  // Configuration with defaults
  const apiEndpoint = config?.apiEndpoint || '/api/learnbot';
  const userId = config?.userId || 'anonymous';
  const enableAnalytics = config?.enableAnalytics ?? true;
  const autoSave = config?.autoSave ?? true;
  
  // State management
  const [state, setState] = useState<LearnBotState>({
    isActive: false,
    currentWalkthrough: null,
    currentStep: 0,
    qaHistory: [],
    learnerProfile: null,
    analytics: {
      totalInteractions: 0,
      sessionStartTime: null,
      completedWalkthroughs: [],
      averageConfidence: 0.5
    }
  });
  
  // Refs for tracking
  const sessionStartRef = useRef<Date | null>(null);
  const interactionCountRef = useRef(0);
  
  // Initialize learner profile on mount
  useEffect(() => {
    if (!state.learnerProfile) {
      const profile = createDefaultLearnerProfile(userId, {});
      setState(prev => ({ ...prev, learnerProfile: profile }));
    }
  }, [userId]);
  
  // Auto-save progress
  useEffect(() => {
    if (autoSave && state.currentWalkthrough) {
      localStorage.setItem(
        `learnbot_progress_${userId}`,
        JSON.stringify({
          walkthroughId: state.currentWalkthrough.id,
          currentStep: state.currentStep,
          timestamp: new Date().toISOString()
        })
      );
    }
  }, [state.currentWalkthrough, state.currentStep, userId, autoSave]);
  
  // API call wrapper with error handling
  const apiCall = async (endpoint: string, payload: any): Promise<any> => {
    try {
      const response = await fetch(`${apiEndpoint}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: endpoint,
          payload: {
            ...payload,
            user_id: userId,
            context: state.learnerProfile?.currentContext
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update analytics
      if (enableAnalytics) {
        interactionCountRef.current += 1;
        setState(prev => ({
          ...prev,
          analytics: {
            ...prev.analytics,
            totalInteractions: interactionCountRef.current
          }
        }));
      }
      
      return result;
      
    } catch (error) {
      console.error('LearnBot API error:', error);
      return {
        status: 'error',
        message: 'I\'m having trouble connecting right now. Please try again.',
        error: error.message
      };
    }
  };
  
  // Core learning functions
  const ask = useCallback(async (question: string, context?: any): Promise<QAResponse> => {
    const result = await apiCall('ask', { question, context });
    
    if (result.status === 'success') {
      const qaEntry = {
        question,
        answer: result as QAResponse,
        timestamp: new Date()
      };
      
      setState(prev => ({
        ...prev,
        qaHistory: [...prev.qaHistory, qaEntry]
      }));
      
      return result as QAResponse;
    }
    
    // Fallback response following adult learning principles
    return {
      answer: result.message || 'I need more context to help you effectively. Could you provide more details about what you\'re trying to accomplish?',
      confidence: 0.1,
      sources: [],
      followUpSuggestions: ['Provide more context', 'Ask a more specific question'],
      learningTip: '💡 **Learning Tip:** The more specific your question, the better I can tailor my help to your needs.'
    };
  }, [apiCall]);
  
  const startWalkthrough = useCallback(async (topic: string, context?: any): Promise<Walkthrough> => {
    // Start session tracking
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date();
      setState(prev => ({
        ...prev,
        analytics: { ...prev.analytics, sessionStartTime: sessionStartRef.current }
      }));
    }
    
    const result = await apiCall('tour', { topic, context });
    
    if (result.status === 'success' && result.walkthrough) {
      const walkthrough = result.walkthrough as Walkthrough;
      
      setState(prev => ({
        ...prev,
        currentWalkthrough: walkthrough,
        currentStep: 0,
        isActive: true
      }));
      
      return walkthrough;
    }
    
    throw new Error(result.message || 'Failed to create walkthrough');
  }, [apiCall]);
  
  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.currentWalkthrough) return prev;
      
      const nextStepIndex = Math.min(
        prev.currentStep + 1,
        prev.currentWalkthrough.steps.length - 1
      );
      
      return { ...prev, currentStep: nextStepIndex };
    });
  }, []);
  
  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  }, []);
  
  const skipStep = useCallback(() => {
    setState(prev => {
      if (!prev.currentWalkthrough?.navigation.allowSkip) return prev;
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);
  
  const getHint = useCallback(async (strugglingWith?: string): Promise<string> => {
    const result = await apiCall('hint', { struggle_with: strugglingWith });
    return result.hint || 'Take a moment to think about what you\'re trying to achieve. Break it down into smaller steps.';
  }, [apiCall]);
  
  const trackProgress = useCallback((stepId: string, confidence: number, timeSpent: number) => {
    if (enableAnalytics) {
      apiCall('progress', {
        objective_id: state.currentWalkthrough?.id,
        step_id: stepId,
        confidence,
        time_spent: timeSpent,
        progress: (state.currentStep + 1) / (state.currentWalkthrough?.steps.length || 1) * 100
      });
      
      // Update local analytics
      setState(prev => ({
        ...prev,
        analytics: {
          ...prev.analytics,
          averageConfidence: (prev.analytics.averageConfidence + confidence) / 2
        }
      }));
    }
  }, [enableAnalytics, apiCall, state.currentWalkthrough, state.currentStep]);
  
  const updateLearnerProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setState(prev => ({
      ...prev,
      learnerProfile: prev.learnerProfile ? { ...prev.learnerProfile, ...updates } : null
    }));
  }, []);
  
  const toggleLearnBot = useCallback(() => {
    setState(prev => ({ ...prev, isActive: !prev.isActive }));
  }, []);
  
  const showTooltip = useCallback((element: HTMLElement, content: string) => {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'learnbot-tooltip';
    tooltip.innerHTML = content;
    tooltip.style.cssText = `
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      max-width: 300px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    
    // Add to DOM
    document.body.appendChild(tooltip);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 5000);
  }, []);
  
  const hideTooltip = useCallback(() => {
    const tooltips = document.querySelectorAll('.learnbot-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }, []);
  
  const getAnalytics = useCallback(async () => {
    return await apiCall('analytics', {});
  }, [apiCall]);
  
  const exportLearningRecord = useCallback(() => {
    const learningRecord = {
      userId,
      profile: state.learnerProfile,
      analytics: state.analytics,
      qaHistory: state.qaHistory,
      completedWalkthroughs: state.analytics.completedWalkthroughs,
      exportedAt: new Date().toISOString()
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(learningRecord, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnbot_record_${userId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [userId, state]);
  
  return {
    state,
    ask,
    startWalkthrough,
    nextStep,
    previousStep,
    skipStep,
    getHint,
    trackProgress,
    updateLearnerProfile,
    toggleLearnBot,
    showTooltip,
    hideTooltip,
    getAnalytics,
    exportLearningRecord
  };
};

// Higher-order component for easy integration
export const withLearnBot = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const learnbot = useLearnBot();
    return <Component {...props} learnbot={learnbot} />;
  };
};

// Context provider for app-wide LearnBot access
import React, { createContext, useContext } from 'react';

const LearnBotContext = createContext<UseLearnBotReturn | null>(null);

export const LearnBotProvider: React.FC<{
  children: React.ReactNode;
  config?: Parameters<typeof useLearnBot>[0];
}> = ({ children, config }) => {
  const learnbot = useLearnBot(config);
  
  return (
    <LearnBotContext.Provider value={learnbot}>
      {children}
    </LearnBotContext.Provider>
  );
};

export const useLearnBotContext = (): UseLearnBotReturn => {
  const context = useContext(LearnBotContext);
  if (!context) {
    throw new Error('useLearnBotContext must be used within a LearnBotProvider');
  }
  return context;
};

// Example usage components
export const LearnBotChatDock: React.FC<{
  position?: 'bottom-right' | 'bottom-left' | 'sidebar';
}> = ({ position = 'bottom-right' }) => {
  const { state, ask, toggleLearnBot } = useLearnBotContext();
  const [question, setQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      await ask(question);
      setQuestion('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const positionStyles = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'sidebar': 'relative'
  };
  
  return (
    <div className={`${positionStyles[position]} z-50`}>
      <div className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${
        state.isActive ? 'w-80 h-96' : 'w-12 h-12'
      }`}>
        {state.isActive ? (
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">🎓 LearnBot</h3>
              <button onClick={toggleLearnBot} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-3">
              {state.qaHistory.map((entry, index) => (
                <div key={index} className="mb-3">
                  <div className="bg-blue-50 p-2 rounded text-sm">{entry.question}</div>
                  <div className="bg-gray-50 p-2 rounded mt-1 text-sm">{entry.answer.answer}</div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button
                onClick={handleAsk}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Ask'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={toggleLearnBot}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
          >
            🎓
          </button>
        )}
      </div>
    </div>
  );
};

export default useLearnBot;