/**
 * Streaming Client Component for Client360 Dashboard v2.4.0
 * Provides real-time streaming capabilities for AI responses
 */

class StreamingClient {
  constructor(config = {}) {
    this.config = {
      chunkSize: 20, // Number of tokens per chunk
      streamingDelay: 30, // Milliseconds between chunks
      enableTypingEffect: true,
      typingSpeed: {
        min: 20, // Min ms per token
        max: 50  // Max ms per token
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 1000, // Base delay in ms
        backoffFactor: 1.5 // Exponential backoff multiplier
      },
      ...config
    };
    
    this.activeStreams = new Map();
    this.nextStreamId = 1;
  }
  
  /**
   * Stream AI response with typing effect
   * @param {Object} params - Streaming parameters
   * @param {string|Array} params.content - Content to stream (string or tokens array)
   * @param {Function} params.onChunk - Callback for chunks (chunk, isComplete) => void
   * @param {Function} params.onComplete - Callback when streaming completes (fullText) => void
   * @param {Function} params.onError - Callback for errors (error) => void
   * @param {boolean} params.useTypingEffect - Whether to simulate typing (defaults to config)
   * @returns {number} Stream ID for cancellation
   */
  streamResponse(params) {
    const {
      content,
      onChunk = () => {},
      onComplete = () => {},
      onError = () => {},
      useTypingEffect = this.config.enableTypingEffect
    } = params;
    
    // Generate stream ID
    const streamId = this.nextStreamId++;
    
    // Convert content to array of tokens if it's a string
    const tokens = Array.isArray(content) ? content : this.tokenizeText(content);
    
    // Track stream data
    const streamData = {
      tokens,
      position: 0,
      complete: false,
      accumulated: '',
      timerId: null,
      onChunk,
      onComplete,
      onError
    };
    
    // Store in active streams
    this.activeStreams.set(streamId, streamData);
    
    // Start streaming
    try {
      if (useTypingEffect) {
        this.streamWithTypingEffect(streamId);
      } else {
        this.streamWithFixedChunks(streamId);
      }
    } catch (error) {
      onError(error);
      this.activeStreams.delete(streamId);
    }
    
    return streamId;
  }
  
  /**
   * Stream with fixed chunk sizes
   * @param {number} streamId - Stream ID
   */
  streamWithFixedChunks(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;
    
    const processNextChunk = () => {
      if (!this.activeStreams.has(streamId)) return; // Stream was cancelled
      
      const stream = this.activeStreams.get(streamId);
      if (stream.position >= stream.tokens.length) {
        // Streaming complete
        stream.complete = true;
        stream.onComplete(stream.accumulated);
        this.activeStreams.delete(streamId);
        return;
      }
      
      // Calculate chunk end
      const end = Math.min(stream.position + this.config.chunkSize, stream.tokens.length);
      
      // Get tokens for this chunk
      const chunkTokens = stream.tokens.slice(stream.position, end);
      const chunkText = chunkTokens.join('');
      
      // Update accumulated text
      stream.accumulated += chunkText;
      
      // Call chunk callback
      const isComplete = end >= stream.tokens.length;
      stream.onChunk(chunkText, isComplete);
      
      // Update position
      stream.position = end;
      
      // Schedule next chunk
      if (!isComplete) {
        stream.timerId = setTimeout(processNextChunk, this.config.streamingDelay);
      } else {
        stream.onComplete(stream.accumulated);
        this.activeStreams.delete(streamId);
      }
    };
    
    // Start processing
    processNextChunk();
  }
  
  /**
   * Stream with realistic typing effect
   * @param {number} streamId - Stream ID
   */
  streamWithTypingEffect(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;
    
    const processNextToken = () => {
      if (!this.activeStreams.has(streamId)) return; // Stream was cancelled
      
      const stream = this.activeStreams.get(streamId);
      if (stream.position >= stream.tokens.length) {
        // Streaming complete
        stream.complete = true;
        stream.onComplete(stream.accumulated);
        this.activeStreams.delete(streamId);
        return;
      }
      
      // Get current token
      const token = stream.tokens[stream.position];
      
      // Update accumulated text
      stream.accumulated += token;
      
      // Call chunk callback
      const isComplete = stream.position === stream.tokens.length - 1;
      stream.onChunk(token, isComplete);
      
      // Update position
      stream.position++;
      
      // Calculate delay for next token (varying speeds based on config)
      const { min, max } = this.config.typingSpeed;
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      
      // Apply different timing for punctuation
      const adjustedDelay = this.adjustDelayForToken(token, delay);
      
      // Schedule next token
      if (!isComplete) {
        stream.timerId = setTimeout(processNextToken, adjustedDelay);
      } else {
        stream.onComplete(stream.accumulated);
        this.activeStreams.delete(streamId);
      }
    };
    
    // Start processing
    processNextToken();
  }
  
  /**
   * Adjust delay based on token content
   * @param {string} token - Token to analyze
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Adjusted delay
   */
  adjustDelayForToken(token, baseDelay) {
    // Add extra pauses for punctuation
    if (token === '.' || token === '!' || token === '?') {
      return baseDelay * 2; // Longer pause after sentences
    } else if (token === ',' || token === ';' || token === ':') {
      return baseDelay * 1.5; // Medium pause after clauses
    } else if (token === ' ') {
      return baseDelay * 0.8; // Slightly quicker for spaces
    }
    
    return baseDelay;
  }
  
  /**
   * Cancel an active stream
   * @param {number} streamId - Stream ID to cancel
   * @returns {boolean} Success status
   */
  cancelStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;
    
    // Clear timeout if active
    if (stream.timerId) {
      clearTimeout(stream.timerId);
    }
    
    // Remove stream
    this.activeStreams.delete(streamId);
    
    return true;
  }
  
  /**
   * Cancel all active streams
   */
  cancelAllStreams() {
    for (const streamId of this.activeStreams.keys()) {
      this.cancelStream(streamId);
    }
  }
  
  /**
   * Simple tokenizer for text
   * This is a basic implementation - in production you might want a more sophisticated tokenizer
   * @param {string} text - Text to tokenize
   * @returns {Array<string>} Array of tokens
   */
  tokenizeText(text) {
    if (!text) return [];
    
    // Simple character-based tokenization with some grouping for common patterns
    const tokens = [];
    let currentToken = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Group alphanumeric characters
      if (/[a-zA-Z0-9]/.test(char)) {
        currentToken += char;
      } 
      // Handle spaces
      else if (char === ' ') {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(' ');
      }
      // Handle punctuation
      else {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(char);
      }
    }
    
    // Add any remaining token
    if (currentToken) {
      tokens.push(currentToken);
    }
    
    return tokens;
  }
  
  /**
   * Stream response from a fetch request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @param {Function} onChunk - Callback for chunks (chunk, isComplete) => void
   * @param {Function} onComplete - Callback when streaming completes (fullText) => void
   * @param {Function} onError - Callback for errors (error) => void
   * @returns {number} Stream ID for cancellation
   */
  async streamFromApi(url, options = {}, onChunk, onComplete, onError) {
    // Generate stream ID
    const streamId = this.nextStreamId++;
    
    try {
      // Track stream data
      const streamData = {
        position: 0,
        complete: false,
        accumulated: '',
        controller: new AbortController(),
        onChunk,
        onComplete,
        onError
      };
      
      // Store in active streams
      this.activeStreams.set(streamId, streamData);
      
      // Add signal to options
      const fetchOptions = {
        ...options,
        signal: streamData.controller.signal
      };
      
      // Make fetch request
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser');
      }
      
      // Set up stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      
      const readChunk = async () => {
        if (!this.activeStreams.has(streamId)) return; // Stream was cancelled
        
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            // Stream complete
            const stream = this.activeStreams.get(streamId);
            stream.complete = true;
            stream.onComplete(stream.accumulated);
            this.activeStreams.delete(streamId);
            return;
          }
          
          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Update accumulated text
          const stream = this.activeStreams.get(streamId);
          stream.accumulated += chunk;
          
          // Call chunk callback
          stream.onChunk(chunk, false);
          
          // Continue reading
          readChunk();
        } catch (error) {
          if (error.name === 'AbortError') return; // Cancelled
          
          const stream = this.activeStreams.get(streamId);
          stream.onError(error);
          this.activeStreams.delete(streamId);
        }
      };
      
      // Start reading
      readChunk();
      
      return streamId;
    } catch (error) {
      onError(error);
      this.activeStreams.delete(streamId);
      return -1;
    }
  }
}

// Export to window
window.StreamingClient = StreamingClient;