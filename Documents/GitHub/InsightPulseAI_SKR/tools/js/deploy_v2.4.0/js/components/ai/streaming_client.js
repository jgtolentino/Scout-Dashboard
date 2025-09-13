/**
 * StreamingClient - Client for real-time AI text generation with typing effects
 * Part of the Multi-Model AI Framework for Client360 Dashboard v2.4.0
 */
class StreamingClient {
  /**
   * Creates a new StreamingClient instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      apiEndpoint: '/api/ai/streaming',
      aiEngine: null,             // Optional AIEngine reference
      typingSpeed: 'natural',     // 'natural', 'fast', 'slow', or words per minute (e.g. 350)
      typingVariation: true,      // Add natural variation to typing speed
      showCursor: true,           // Show typing cursor
      cursorChar: '|',            // Cursor character
      allowHtml: false,           // Whether to allow HTML in the streamed text
      autoScroll: true,           // Auto scroll container to bottom
      debug: false,
      ...config
    };
    
    // Core properties
    this.activeStreams = new Map();
    this.streamCounter = 0;
    this.eventHandlers = new Map();
    
    // Initialize
    this._initializeClient();
  }
  
  /**
   * Initialize the streaming client
   * @private
   */
  _initializeClient() {
    if (this.config.debug) {
      console.log('StreamingClient initialized with config:', this.config);
    }
    
    // Trigger initialized event
    this._triggerEvent('initialized', { config: this.config });
  }
  
  /**
   * Stream text to a DOM element
   * @param {Object} params - Streaming parameters
   * @param {string} params.elementId - ID of the DOM element to stream to
   * @param {string} params.prompt - The prompt to generate text from
   * @param {string} params.modelId - Optional model ID to use
   * @param {Object} params.options - Additional streaming options
   * @returns {Object} - Stream control object
   */
  streamToElement(params) {
    const { 
      elementId, 
      prompt, 
      modelId = null,
      options = {}
    } = params;
    
    if (!elementId) {
      throw new Error('Element ID is required');
    }
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    // Get the target element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }
    
    // Merge options with defaults
    const streamOptions = {
      typingSpeed: options.typingSpeed || this.config.typingSpeed,
      typingVariation: options.typingVariation !== undefined ? options.typingVariation : this.config.typingVariation,
      showCursor: options.showCursor !== undefined ? options.showCursor : this.config.showCursor,
      cursorChar: options.cursorChar || this.config.cursorChar,
      clearElement: options.clearElement !== undefined ? options.clearElement : true,
      allowHtml: options.allowHtml !== undefined ? options.allowHtml : this.config.allowHtml,
      autoScroll: options.autoScroll !== undefined ? options.autoScroll : this.config.autoScroll,
      appendResult: options.appendResult || false
    };
    
    // Clear the element if requested
    if (streamOptions.clearElement) {
      element.innerHTML = '';
    }
    
    // Create a unique stream ID
    const streamId = `stream_${Date.now()}_${this.streamCounter++}`;
    
    // Set up cursor if enabled
    let cursorElement = null;
    if (streamOptions.showCursor) {
      cursorElement = document.createElement('span');
      cursorElement.className = 'ai-cursor';
      cursorElement.textContent = streamOptions.cursorChar;
      cursorElement.style.animation = 'ai-cursor-blink 1s infinite';
      element.appendChild(cursorElement);
      
      // Add cursor blink animation if not already in document
      this._ensureCursorStyle();
    }
    
    // Calculate typing speed in milliseconds per character
    const typingDelayMs = this._calculateTypingDelay(streamOptions.typingSpeed);
    
    // Create a buffer for incoming tokens
    const tokenBuffer = [];
    let isProcessingBuffer = false;
    
    // Function to process token buffer
    const processBuffer = async () => {
      if (isProcessingBuffer || tokenBuffer.length === 0) return;
      
      isProcessingBuffer = true;
      
      while (tokenBuffer.length > 0) {
        const token = tokenBuffer.shift();
        
        // Handle HTML content if allowed
        if (streamOptions.allowHtml && token.includes('<') && token.includes('>')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = token;
          
          // Insert the HTML before the cursor if present
          if (cursorElement) {
            element.insertBefore(tempDiv.firstChild, cursorElement);
          } else {
            element.appendChild(tempDiv.firstChild);
          }
        } else {
          // Create text node
          const textNode = document.createTextNode(token);
          
          // Insert text before cursor if present
          if (cursorElement) {
            element.insertBefore(textNode, cursorElement);
          } else {
            element.appendChild(textNode);
          }
        }
        
        // Auto scroll if enabled
        if (streamOptions.autoScroll) {
          element.scrollTop = element.scrollHeight;
        }
        
        // Add delay for typing effect
        if (typingDelayMs > 0) {
          // Add natural variation to typing speed if enabled
          const delay = streamOptions.typingVariation 
            ? this._getVariedDelay(typingDelayMs, token)
            : typingDelayMs;
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      isProcessingBuffer = false;
    };
    
    // Start the stream
    let streamControl;
    
    // Use AIEngine if available
    if (this.config.aiEngine) {
      streamControl = this.config.aiEngine.streamResponse({
        prompt,
        modelId,
        onToken: (token) => {
          tokenBuffer.push(token);
          processBuffer();
          this._triggerEvent('token', { streamId, token });
        },
        onComplete: (fullText) => {
          // Remove cursor when done
          if (cursorElement) {
            element.removeChild(cursorElement);
          }
          
          // Remove from active streams
          this.activeStreams.delete(streamId);
          
          this._triggerEvent('complete', { 
            streamId, 
            elementId, 
            fullText 
          });
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          
          // Remove cursor on error
          if (cursorElement) {
            element.removeChild(cursorElement);
          }
          
          // Remove from active streams
          this.activeStreams.delete(streamId);
          
          this._triggerEvent('error', { 
            streamId, 
            elementId, 
            error 
          });
        }
      });
    } else {
      // Create EventSource for streaming
      try {
        const url = new URL(this.config.apiEndpoint, window.location.origin);
        url.searchParams.append('prompt', prompt);
        if (modelId) {
          url.searchParams.append('modelId', modelId);
        }
        
        const eventSource = new EventSource(url.toString());
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.token) {
              tokenBuffer.push(data.token);
              processBuffer();
              this._triggerEvent('token', { streamId, token: data.token });
            }
            
            if (data.done) {
              eventSource.close();
              
              // Remove cursor when done
              if (cursorElement) {
                element.removeChild(cursorElement);
              }
              
              // Remove from active streams
              this.activeStreams.delete(streamId);
              
              this._triggerEvent('complete', { 
                streamId, 
                elementId, 
                fullText: data.fullText || element.textContent 
              });
            }
          } catch (error) {
            console.error('Error parsing stream message:', error);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          
          // Remove cursor on error
          if (cursorElement) {
            element.removeChild(cursorElement);
          }
          
          // Remove from active streams
          this.activeStreams.delete(streamId);
          
          this._triggerEvent('error', { 
            streamId, 
            elementId, 
            error 
          });
        };
        
        // Create stream control object
        streamControl = {
          abort: () => {
            eventSource.close();
            
            // Remove cursor on abort
            if (cursorElement) {
              element.removeChild(cursorElement);
            }
            
            // Remove from active streams
            this.activeStreams.delete(streamId);
            
            this._triggerEvent('aborted', { streamId, elementId });
          }
        };
      } catch (error) {
        console.error('Error creating EventSource:', error);
        throw error;
      }
    }
    
    // Store stream info
    this.activeStreams.set(streamId, {
      elementId,
      prompt,
      modelId,
      startTime: Date.now(),
      control: streamControl
    });
    
    // Trigger stream started event
    this._triggerEvent('started', { 
      streamId, 
      elementId, 
      prompt,
      modelId 
    });
    
    // Return control object with stream ID
    return {
      streamId,
      abort: () => {
        if (this.activeStreams.has(streamId)) {
          const stream = this.activeStreams.get(streamId);
          if (stream.control && typeof stream.control.abort === 'function') {
            stream.control.abort();
          }
        }
      }
    };
  }
  
  /**
   * Stream text and return as a promise
   * @param {Object} params - Streaming parameters
   * @param {string} params.prompt - The prompt to generate text from
   * @param {string} params.modelId - Optional model ID to use
   * @param {Function} params.onToken - Optional callback for each token
   * @returns {Promise<string>} - Generated text
   */
  streamAsPromise(params) {
    const { prompt, modelId = null, onToken = null } = params;
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    return new Promise((resolve, reject) => {
      // Create a unique stream ID
      const streamId = `stream_${Date.now()}_${this.streamCounter++}`;
      
      // Buffer to collect the full text
      const textBuffer = [];
      
      // Start the stream
      let streamControl;
      
      // Use AIEngine if available
      if (this.config.aiEngine) {
        streamControl = this.config.aiEngine.streamResponse({
          prompt,
          modelId,
          onToken: (token) => {
            textBuffer.push(token);
            
            if (onToken && typeof onToken === 'function') {
              onToken(token);
            }
            
            this._triggerEvent('token', { streamId, token });
          },
          onComplete: () => {
            const fullText = textBuffer.join('');
            
            // Remove from active streams
            this.activeStreams.delete(streamId);
            
            this._triggerEvent('complete', { 
              streamId, 
              fullText 
            });
            
            resolve(fullText);
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            
            // Remove from active streams
            this.activeStreams.delete(streamId);
            
            this._triggerEvent('error', { 
              streamId, 
              error 
            });
            
            reject(error);
          }
        });
      } else {
        // Create EventSource for streaming
        try {
          const url = new URL(this.config.apiEndpoint, window.location.origin);
          url.searchParams.append('prompt', prompt);
          if (modelId) {
            url.searchParams.append('modelId', modelId);
          }
          
          const eventSource = new EventSource(url.toString());
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.token) {
                textBuffer.push(data.token);
                
                if (onToken && typeof onToken === 'function') {
                  onToken(data.token);
                }
                
                this._triggerEvent('token', { streamId, token: data.token });
              }
              
              if (data.done) {
                eventSource.close();
                
                const fullText = data.fullText || textBuffer.join('');
                
                // Remove from active streams
                this.activeStreams.delete(streamId);
                
                this._triggerEvent('complete', { 
                  streamId, 
                  fullText 
                });
                
                resolve(fullText);
              }
            } catch (error) {
              console.error('Error parsing stream message:', error);
              reject(error);
            }
          };
          
          eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            eventSource.close();
            
            // Remove from active streams
            this.activeStreams.delete(streamId);
            
            this._triggerEvent('error', { 
              streamId, 
              error 
            });
            
            reject(error);
          };
          
          // Create stream control object
          streamControl = {
            abort: () => {
              eventSource.close();
              
              // Remove from active streams
              this.activeStreams.delete(streamId);
              
              this._triggerEvent('aborted', { streamId });
              
              reject(new Error('Stream aborted'));
            }
          };
        } catch (error) {
          console.error('Error creating EventSource:', error);
          reject(error);
        }
      }
      
      // Store stream info
      this.activeStreams.set(streamId, {
        prompt,
        modelId,
        startTime: Date.now(),
        control: streamControl
      });
      
      // Trigger stream started event
      this._triggerEvent('started', { 
        streamId, 
        prompt,
        modelId 
      });
    });
  }
  
  /**
   * Abort all active streams
   */
  abortAll() {
    for (const [streamId, stream] of this.activeStreams.entries()) {
      if (stream.control && typeof stream.control.abort === 'function') {
        stream.control.abort();
      }
    }
    
    // Clear active streams
    this.activeStreams.clear();
    
    this._triggerEvent('allAborted');
  }
  
  /**
   * Get all active streams
   * @returns {Object} - Map of active streams
   */
  getActiveStreams() {
    const streams = {};
    
    for (const [streamId, stream] of this.activeStreams.entries()) {
      streams[streamId] = {
        ...stream,
        duration: Date.now() - stream.startTime
      };
    }
    
    return streams;
  }
  
  /**
   * Register event handler
   * @param {string} eventName - Event name to listen for
   * @param {Function} handler - Handler function
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
    
    return this; // For chaining
  }
  
  /**
   * Unregister event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      return this;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    return this; // For chaining
  }
  
  /**
   * Calculate typing delay based on speed setting
   * @param {string|number} speed - Typing speed setting
   * @returns {number} - Delay in milliseconds per character
   * @private
   */
  _calculateTypingDelay(speed) {
    if (typeof speed === 'number') {
      // Convert words per minute to ms per character
      // Assuming average word length of 5 characters
      return (60 * 1000) / (speed * 5);
    }
    
    // Predefined speeds
    switch (speed) {
      case 'fast':
        return 10; // 10ms per character
      case 'slow':
        return 80; // 80ms per character
      case 'natural':
      default:
        return 30; // 30ms per character
    }
  }
  
  /**
   * Get varied typing delay for natural effect
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {string} token - Current token
   * @returns {number} - Varied delay in milliseconds
   * @private
   */
  _getVariedDelay(baseDelay, token) {
    // Add variation based on token content
    let multiplier = 1;
    
    // Slow down for punctuation
    if (/[,.!?;:]/.test(token)) {
      multiplier = 2.5;
    }
    // Speed up for common words
    else if (/^(the|and|or|in|of|to|a|an)$/.test(token.trim().toLowerCase())) {
      multiplier = 0.8;
    }
    // Random variation (±20%)
    else {
      multiplier = 0.8 + (Math.random() * 0.4);
    }
    
    return baseDelay * multiplier;
  }
  
  /**
   * Ensure cursor blink animation style is in document
   * @private
   */
  _ensureCursorStyle() {
    // Check if style already exists
    if (document.getElementById('ai-cursor-style')) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'ai-cursor-style';
    style.textContent = `
      @keyframes ai-cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .ai-cursor {
        display: inline-block;
        animation: ai-cursor-blink 1s infinite;
        font-weight: bold;
      }
    `;
    
    // Add to document head
    document.head.appendChild(style);
  }
  
  /**
   * Trigger an event to all registered handlers
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   * @private
   */
  _triggerEvent(eventName, data = null) {
    if (!this.eventHandlers.has(eventName)) return;
    
    for (const handler of this.eventHandlers.get(eventName)) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in streaming client event handler for ${eventName}:`, error);
      }
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StreamingClient;
} else if (typeof window !== 'undefined') {
  window.StreamingClient = StreamingClient;
}