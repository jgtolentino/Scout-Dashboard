import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

/**
 * Hook for communicating with the Pulser AI agents
 * Handles UI generation, component creation, and other AI interactions
 */
const useAgentCommunication = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  const functions = getFunctions();
  const auth = getAuth();
  
  // Generate a complete UI from a text prompt
  const generateFromPrompt = useCallback(async (prompt, options = {}) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Get current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the function call
      const generateUI = httpsCallable(functions, 'generateUI');
      
      // Call the Firebase Function
      const result = await generateUI({
        prompt,
        options: {
          style: options.style || 'modern',
          colorScheme: options.colorScheme,
          components: options.componentTypes,
          layout: options.preferredLayout,
          ...options
        }
      });
      
      // Process and return the result
      const response = result.data;
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('Error generating UI:', error);
      setGenerationError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [functions, auth]);
  
  // Generate a single component from a text prompt
  const generateComponent = useCallback(async (prompt, options = {}) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Get current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the function call
      const generateSingleComponent = httpsCallable(functions, 'generateComponent');
      
      // Call the Firebase Function
      const result = await generateSingleComponent({
        prompt,
        options: {
          type: options.type,
          style: options.style || 'modern',
          ...options
        }
      });
      
      // Process and return the result
      const response = result.data;
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('Error generating component:', error);
      setGenerationError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [functions, auth]);
  
  // Improve existing component or UI with suggestions
  const improveUI = useCallback(async (components, prompt, options = {}) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Get current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the function call
      const improveExistingUI = httpsCallable(functions, 'improveUI');
      
      // Call the Firebase Function
      const result = await improveExistingUI({
        components,
        prompt,
        options: {
          focusAreas: options.focusAreas || ['layout', 'style', 'accessibility'],
          preserveStructure: options.preserveStructure !== false,
          ...options
        }
      });
      
      // Process and return the result
      const response = result.data;
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('Error improving UI:', error);
      setGenerationError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [functions, auth]);
  
  // Generate code from components
  const generateCode = useCallback(async (components, options = {}) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Get current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the function call
      const generateCodeFromComponents = httpsCallable(functions, 'generateCode');
      
      // Call the Firebase Function
      const result = await generateCodeFromComponents({
        components,
        options: {
          framework: options.framework || 'react',
          cssFramework: options.cssFramework || 'tailwind',
          includeComments: options.includeComments !== false,
          optimizeForProduction: options.optimizeForProduction === true,
          ...options
        }
      });
      
      // Process and return the result
      const response = result.data;
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('Error generating code:', error);
      setGenerationError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [functions, auth]);
  
  // Get feedback on UI design
  const getDesignFeedback = useCallback(async (components, options = {}) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Get current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the function call
      const analyzeDesign = httpsCallable(functions, 'analyzeDesign');
      
      // Call the Firebase Function
      const result = await analyzeDesign({
        components,
        options: {
          focusAreas: options.focusAreas || ['usability', 'accessibility', 'consistency'],
          detailLevel: options.detailLevel || 'detailed',
          ...options
        }
      });
      
      // Process and return the result
      const response = result.data;
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('Error getting design feedback:', error);
      setGenerationError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [functions, auth]);
  
  return {
    generateFromPrompt,
    generateComponent,
    improveUI,
    generateCode,
    getDesignFeedback,
    isGenerating,
    lastResponse,
    generationError
  };
};

export default useAgentCommunication;