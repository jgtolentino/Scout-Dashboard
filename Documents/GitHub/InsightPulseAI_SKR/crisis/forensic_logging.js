/**
 * Forensic Logging for Silent Failures
 * RED2025 Emergency Protocol - Phase 1
 * 
 * Enhanced logging system that captures detailed interaction data
 * to diagnose and automatically recover from silent failures.
 */

// Main forensic logging class
class ForensicLogger {
  constructor(options = {}) {
    this.options = {
      captureRageClicks: true,
      captureKeystrokes: true,
      captureMouseMovement: true,
      captureNetworkActivity: true,
      captureExceptions: true,
      captureDOMChanges: true,
      capturePerformanceMetrics: true,
      bufferSize: 1000,
      flushInterval: 5000, // ms
      ...options
    };
    
    this.sessionId = this.generateSessionId();
    this.eventBuffer = [];
    this.rageClickDetector = new RageClickDetector();
    this.frustrationDetector = new FrustrationDetector();
    this.recoveryEngine = new RecoveryEngine();
    
    this.setupEventListeners();
    this.setupFlushInterval();
    
    console.log(`ForensicLogger initialized with session ID: ${this.sessionId}`);
  }
  
  // Generate unique session ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  // Set up event listeners based on configuration
  setupEventListeners() {
    if (this.options.captureRageClicks) {
      document.addEventListener('click', this.handleClick.bind(this));
    }
    
    if (this.options.captureKeystrokes) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    if (this.options.captureMouseMovement) {
      document.addEventListener('mousemove', this.throttle(this.handleMouseMove.bind(this), 100));
    }
    
    if (this.options.captureExceptions) {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    }
    
    if (this.options.captureNetworkActivity) {
      this.interceptFetch();
      this.interceptXHR();
    }
    
    if (this.options.captureDOMChanges) {
      this.observeDOMChanges();
    }
    
    // Custom events for UI components
    document.addEventListener('silentFailure', this.handleSilentFailure.bind(this));
    
    // Navigation events
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Focus events
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }
  
  // Set up interval to flush logs to server
  setupFlushInterval() {
    this.flushIntervalId = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }
  
  // Log an event
  log(eventType, data = {}) {
    const event = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      eventType,
      url: window.location.href,
      userAgent: navigator.userAgent,
      data
    };
    
    this.eventBuffer.push(event);
    
    // Check if buffer is full
    if (this.eventBuffer.length >= this.options.bufferSize) {
      this.flush();
    }
    
    // Check for patterns that might indicate user frustration
    this.frustrationDetector.analyze(event);
    
    return event;
  }
  
  // Flush logs to server
  flush() {
    if (this.eventBuffer.length === 0) return;
    
    const events = [...this.eventBuffer];
    this.eventBuffer = [];
    
    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      events
    };
    
    try {
      // Send logs to server
      fetch('/api/forensic-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        // Use a low priority not to interfere with user actions
        priority: 'low'
      }).catch(err => {
        console.error('Failed to send forensic logs:', err);
        // Put the events back in the buffer
        this.eventBuffer = [...events, ...this.eventBuffer];
      });
    } catch (err) {
      console.error('Error sending logs:', err);
      // Put the events back in the buffer
      this.eventBuffer = [...events, ...this.eventBuffer];
    }
  }
  
  // Handle click events
  handleClick(event) {
    const target = event.target;
    const targetInfo = this.getElementInfo(target);
    
    // Check for rage clicks
    const isRageClick = this.rageClickDetector.detect(target, event);
    
    this.log('click', {
      targetInfo,
      x: event.clientX,
      y: event.clientY,
      isRageClick,
      timestamp: event.timeStamp
    });
    
    // If this is a rage click, trigger recovery
    if (isRageClick) {
      this.recoveryEngine.handleRageClick(target, targetInfo);
    }
  }
  
  // Handle keydown events
  handleKeyDown(event) {
    // Don't capture passwords
    if (event.target.type === 'password') {
      this.log('keydown', {
        targetInfo: this.getElementInfo(event.target),
        isPassword: true,
        timestamp: event.timeStamp
      });
      return;
    }
    
    this.log('keydown', {
      targetInfo: this.getElementInfo(event.target),
      key: event.key,
      keyCode: event.keyCode,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      timestamp: event.timeStamp
    });
  }
  
  // Handle keyup events
  handleKeyUp(event) {
    // Don't capture passwords
    if (event.target.type === 'password') {
      return;
    }
    
    this.log('keyup', {
      targetInfo: this.getElementInfo(event.target),
      key: event.key,
      keyCode: event.keyCode,
      timestamp: event.timeStamp
    });
  }
  
  // Handle mouse movement
  handleMouseMove(event) {
    this.log('mousemove', {
      x: event.clientX,
      y: event.clientY,
      timestamp: event.timeStamp
    });
  }
  
  // Handle JS errors
  handleError(event) {
    this.log('error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? {
        name: event.error.name,
        message: event.error.message,
        stack: event.error.stack
      } : null,
      timestamp: event.timeStamp
    });
    
    // Attempt recovery based on error
    this.recoveryEngine.handleError(event.error);
  }
  
  // Handle promise rejections
  handleRejection(event) {
    let reason = event.reason;
    let reasonText = '';
    
    try {
      reasonText = reason instanceof Error 
        ? `${reason.name}: ${reason.message}\n${reason.stack}` 
        : String(reason);
    } catch (e) {
      reasonText = 'Unable to stringify rejection reason';
    }
    
    this.log('unhandledrejection', {
      reason: reasonText,
      timestamp: event.timeStamp
    });
    
    // Attempt recovery based on rejection
    this.recoveryEngine.handleRejection(reason);
  }
  
  // Handle before unload (user leaving page)
  handleBeforeUnload(event) {
    // Check if there are unsaved changes
    const hasUnsavedChanges = document.querySelectorAll('form.dirty, [data-unsaved]').length > 0;
    
    this.log('beforeunload', {
      hasUnsavedChanges,
      timestamp: event.timeStamp
    });
    
    // Force a log flush immediately before the page unloads
    this.flush();
  }
  
  // Handle window blur (user switching away)
  handleWindowBlur(event) {
    this.log('windowblur', {
      timestamp: event.timeStamp
    });
  }
  
  // Handle window focus (user returning)
  handleWindowFocus(event) {
    this.log('windowfocus', {
      timestamp: event.timeStamp
    });
  }
  
  // Handle silent failures
  handleSilentFailure(event) {
    this.log('silentfailure', {
      componentId: event.detail.componentId,
      operation: event.detail.operation,
      errorCode: event.detail.errorCode,
      context: event.detail.context,
      timestamp: event.timeStamp
    });
    
    // Attempt recovery based on silent failure
    this.recoveryEngine.handleSilentFailure(event.detail);
  }
  
  // Intercept fetch calls
  interceptFetch() {
    const originalFetch = window.fetch;
    const logger = this;
    
    window.fetch = function(resource, init) {
      const startTime = Date.now();
      const requestId = `fetch-${startTime}-${Math.random().toString(36).substring(2, 7)}`;
      
      let url = resource;
      if (resource instanceof Request) {
        url = resource.url;
      }
      
      // Log the request
      logger.log('fetchrequest', {
        requestId,
        url,
        method: init?.method || 'GET',
        timestamp: startTime
      });
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          // Clone the response to read the body without consuming it
          const clone = response.clone();
          
          // Log the response
          logger.log('fetchresponse', {
            requestId,
            url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            duration: Date.now() - startTime,
            timestamp: Date.now()
          });
          
          return response;
        })
        .catch(error => {
          // Log the error
          logger.log('fetcherror', {
            requestId,
            url,
            error: error.message,
            duration: Date.now() - startTime,
            timestamp: Date.now()
          });
          
          // Let the recovery engine handle network errors
          logger.recoveryEngine.handleNetworkError(url, error);
          
          throw error;
        });
    };
  }
  
  // Intercept XMLHttpRequest
  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const logger = this;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._forensicLogInfo = {
        method,
        url,
        requestId: `xhr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      };
      
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      if (!this._forensicLogInfo) {
        this._forensicLogInfo = {
          requestId: `xhr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        };
      }
      
      const startTime = Date.now();
      this._forensicLogInfo.startTime = startTime;
      
      // Log the request
      logger.log('xhrrequest', {
        requestId: this._forensicLogInfo.requestId,
        url: this._forensicLogInfo.url,
        method: this._forensicLogInfo.method,
        timestamp: startTime
      });
      
      // Set up listeners for load, error, and abort
      this.addEventListener('load', function() {
        logger.log('xhrresponse', {
          requestId: this._forensicLogInfo.requestId,
          url: this._forensicLogInfo.url,
          status: this.status,
          statusText: this.statusText,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        });
      });
      
      this.addEventListener('error', function() {
        logger.log('xhrerror', {
          requestId: this._forensicLogInfo.requestId,
          url: this._forensicLogInfo.url,
          timestamp: Date.now()
        });
        
        // Let the recovery engine handle network errors
        logger.recoveryEngine.handleNetworkError(this._forensicLogInfo.url, new Error('XHR request failed'));
      });
      
      this.addEventListener('abort', function() {
        logger.log('xhrabort', {
          requestId: this._forensicLogInfo.requestId,
          url: this._forensicLogInfo.url,
          timestamp: Date.now()
        });
      });
      
      return originalSend.apply(this, arguments);
    };
  }
  
  // Observe DOM changes
  observeDOMChanges() {
    const logger = this;
    
    const observer = new MutationObserver((mutations) => {
      // Batch DOM changes to avoid excessive logging
      const addedNodes = [];
      const removedNodes = [];
      const attributeChanges = [];
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              addedNodes.push(logger.getElementInfo(node));
            }
          });
          
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              removedNodes.push(logger.getElementInfo(node));
            }
          });
        } else if (mutation.type === 'attributes') {
          attributeChanges.push({
            target: logger.getElementInfo(mutation.target),
            attribute: mutation.attributeName,
            oldValue: mutation.oldValue
          });
        }
      });
      
      if (addedNodes.length > 0 || removedNodes.length > 0 || attributeChanges.length > 0) {
        logger.log('dommutation', {
          addedNodes,
          removedNodes,
          attributeChanges,
          timestamp: Date.now()
        });
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeOldValue: true
    });
  }
  
  // Helper: get information about a DOM element
  getElementInfo(element) {
    if (!element || !element.tagName) {
      return { type: 'unknown' };
    }
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      type: element.type || null,
      name: element.name || null,
      value: element.type === 'password' ? '********' : (element.value || null),
      checked: element.checked !== undefined ? element.checked : null,
      disabled: element.disabled !== undefined ? element.disabled : null,
      readOnly: element.readOnly !== undefined ? element.readOnly : null,
      href: element.href || null,
      src: element.src || null,
      alt: element.alt || null,
      title: element.title || null,
      placeholder: element.placeholder || null,
      ariaLabel: element.getAttribute('aria-label') || null,
      path: this.getElementPath(element),
      text: this.getElementText(element)
    };
  }
  
  // Helper: get text content of an element (abbreviated)
  getElementText(element) {
    if (!element) return null;
    
    const text = element.textContent || element.innerText || '';
    // Limit text length and remove excess whitespace
    return text.trim().replace(/\s+/g, ' ').substring(0, 100);
  }
  
  // Helper: get the CSS path of an element
  getElementPath(element) {
    if (!element || !element.tagName) return '';
    
    let path = [];
    let currentElement = element;
    
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let selector = currentElement.tagName.toLowerCase();
      
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = currentElement;
        let siblingIndex = 1;
        
        while (sibling = sibling.previousElementSibling) {
          if (sibling.tagName === currentElement.tagName) {
            siblingIndex++;
          }
        }
        
        if (siblingIndex > 1) {
          selector += `:nth-of-type(${siblingIndex})`;
        }
        
        path.unshift(selector);
        currentElement = currentElement.parentNode;
      }
    }
    
    return path.join(' > ');
  }
  
  // Helper: throttle function to avoid excessive events
  throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
  // Clean up when done
  destroy() {
    clearInterval(this.flushIntervalId);
    this.flush(); // Flush any remaining logs
    
    // Remove event listeners
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.throttle(this.handleMouseMove, 100));
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
    document.removeEventListener('silentFailure', this.handleSilentFailure);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    
    console.log(`ForensicLogger session ${this.sessionId} destroyed`);
  }
}

// Rage click detector
class RageClickDetector {
  constructor(options = {}) {
    this.options = {
      clickThreshold: 3, // Number of clicks to consider a rage click
      timeWindow: 2000, // Time window in ms
      ...options
    };
    
    this.clickHistory = new Map(); // Map of elements to click timestamps
  }
  
  detect(element, event) {
    const now = Date.now();
    const key = this.getElementKey(element);
    
    if (!this.clickHistory.has(key)) {
      this.clickHistory.set(key, []);
    }
    
    const clickTimes = this.clickHistory.get(key);
    
    // Add current click time
    clickTimes.push(now);
    
    // Remove clicks outside the time window
    const filtered = clickTimes.filter(time => now - time < this.options.timeWindow);
    this.clickHistory.set(key, filtered);
    
    // Check if we have enough clicks in the time window
    const isRageClick = filtered.length >= this.options.clickThreshold;
    
    if (isRageClick) {
      // Dispatch a custom event for rage click
      const rageClickEvent = new CustomEvent('rageclick', {
        bubbles: true,
        detail: {
          element,
          clickTimes: filtered,
          originalEvent: event
        }
      });
      
      element.dispatchEvent(rageClickEvent);
    }
    
    return isRageClick;
  }
  
  // Helper to get a unique-ish key for an element
  getElementKey(element) {
    const elementInfo = {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 20)
    };
    
    return JSON.stringify(elementInfo);
  }
  
  // Clean up old entries
  cleanup() {
    const now = Date.now();
    
    for (const [key, times] of this.clickHistory.entries()) {
      const filtered = times.filter(time => now - time < this.options.timeWindow);
      
      if (filtered.length === 0) {
        this.clickHistory.delete(key);
      } else {
        this.clickHistory.set(key, filtered);
      }
    }
  }
}

// Frustration detector
class FrustrationDetector {
  constructor() {
    this.frustrationScore = 0;
    this.frustrationThreshold = 5;
    this.events = [];
    this.lastReportedFrustration = 0;
  }
  
  analyze(event) {
    this.events.push(event);
    
    // Keep only recent events (last 2 minutes)
    const now = Date.now();
    this.events = this.events.filter(e => now - e.timestamp < 120000);
    
    // Update frustration score
    this.updateFrustrationScore();
    
    // Report high frustration
    if (this.frustrationScore >= this.frustrationThreshold && 
        now - this.lastReportedFrustration > 10000) {
      this.reportFrustration();
      this.lastReportedFrustration = now;
    }
  }
  
  updateFrustrationScore() {
    let score = 0;
    
    // Analyze recent events for frustration patterns
    const rageClicks = this.events.filter(e => 
      e.eventType === 'click' && e.data.isRageClick).length;
    
    const rapidKeyStrokes = this.detectRapidKeyStrokes();
    const backSpaceCount = this.events.filter(e => 
      e.eventType === 'keydown' && e.data.key === 'Backspace').length;
    
    const errors = this.events.filter(e => 
      e.eventType === 'error' || e.eventType === 'unhandledrejection').length;
    
    const silentFailures = this.events.filter(e => 
      e.eventType === 'silentfailure').length;
    
    // Weight the different factors
    score += rageClicks * 2;
    score += rapidKeyStrokes ? 1 : 0;
    score += Math.min(backSpaceCount / 5, 2); // Cap at 2 points
    score += errors * 1.5;
    score += silentFailures * 3;
    
    this.frustrationScore = score;
    return score;
  }
  
  detectRapidKeyStrokes() {
    const keyEvents = this.events.filter(e => 
      e.eventType === 'keydown' || e.eventType === 'keyup');
    
    if (keyEvents.length < 10) return false;
    
    // Calculate average time between keystrokes
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < keyEvents.length; i++) {
      const timeDiff = keyEvents[i].timestamp - keyEvents[i-1].timestamp;
      if (timeDiff < 1000) { // Ignore pauses longer than 1 second
        totalTime += timeDiff;
        count++;
      }
    }
    
    if (count === 0) return false;
    
    const avgTime = totalTime / count;
    return avgTime < 100; // Less than 100ms between keystrokes
  }
  
  reportFrustration() {
    // Create a frustration event
    const frustrationEvent = new CustomEvent('userfrustrateddetected', {
      bubbles: true,
      detail: {
        score: this.frustrationScore,
        timestamp: Date.now(),
        recentEvents: this.events.slice(-20) // Last 20 events
      }
    });
    
    document.dispatchEvent(frustrationEvent);
    
    // Log to console for debugging
    console.warn(`User frustration detected! Score: ${this.frustrationScore}`);
  }
}

// Recovery engine
class RecoveryEngine {
  constructor() {
    this.recoveryStrategies = {
      rageClick: this.recoverFromRageClick.bind(this),
      networkError: this.recoverFromNetworkError.bind(this),
      error: this.recoverFromError.bind(this),
      rejection: this.recoverFromRejection.bind(this),
      silentFailure: this.recoverFromSilentFailure.bind(this)
    };
    
    // Recovery attempts history
    this.recoveryAttempts = new Map();
  }
  
  // Handle rage clicks
  handleRageClick(element, elementInfo) {
    console.log('Handling rage click on:', elementInfo);
    
    // Get or create recovery history for this element
    const elementKey = JSON.stringify(elementInfo);
    if (!this.recoveryAttempts.has(elementKey)) {
      this.recoveryAttempts.set(elementKey, []);
    }
    
    const attempts = this.recoveryAttempts.get(elementKey);
    
    // Check if we've tried to recover too many times
    if (attempts.length >= 3) {
      console.log('Too many recovery attempts for this element, showing help instead');
      this.showHelp(element, 'rageClick');
      return;
    }
    
    // Record this attempt
    attempts.push({
      timestamp: Date.now(),
      type: 'rageClick'
    });
    
    // Attempt recovery
    this.recoveryStrategies.rageClick(element, elementInfo);
  }
  
  // Handle network errors
  handleNetworkError(url, error) {
    console.log('Handling network error for:', url, error);
    
    // Get or create recovery history for this URL
    if (!this.recoveryAttempts.has(url)) {
      this.recoveryAttempts.set(url, []);
    }
    
    const attempts = this.recoveryAttempts.get(url);
    
    // Check if we've tried to recover too many times
    if (attempts.length >= 3) {
      console.log('Too many recovery attempts for this URL, showing error instead');
      this.showOfflineMessage(url);
      return;
    }
    
    // Record this attempt
    attempts.push({
      timestamp: Date.now(),
      type: 'networkError'
    });
    
    // Attempt recovery
    this.recoveryStrategies.networkError(url, error);
  }
  
  // Handle JavaScript errors
  handleError(error) {
    console.log('Handling error:', error);
    
    // Create an error key
    const errorKey = `${error.name}:${error.message}`;
    
    // Get or create recovery history for this error
    if (!this.recoveryAttempts.has(errorKey)) {
      this.recoveryAttempts.set(errorKey, []);
    }
    
    const attempts = this.recoveryAttempts.get(errorKey);
    
    // Check if we've tried to recover too many times
    if (attempts.length >= 3) {
      console.log('Too many recovery attempts for this error, showing error instead');
      this.showErrorMessage(error);
      return;
    }
    
    // Record this attempt
    attempts.push({
      timestamp: Date.now(),
      type: 'error'
    });
    
    // Attempt recovery
    this.recoveryStrategies.error(error);
  }
  
  // Handle promise rejections
  handleRejection(reason) {
    console.log('Handling rejection:', reason);
    
    // Create a rejection key
    const rejectionKey = reason instanceof Error 
      ? `${reason.name}:${reason.message}`
      : String(reason);
    
    // Get or create recovery history for this rejection
    if (!this.recoveryAttempts.has(rejectionKey)) {
      this.recoveryAttempts.set(rejectionKey, []);
    }
    
    const attempts = this.recoveryAttempts.get(rejectionKey);
    
    // Check if we've tried to recover too many times
    if (attempts.length >= 3) {
      console.log('Too many recovery attempts for this rejection, showing error instead');
      this.showErrorMessage(reason);
      return;
    }
    
    // Record this attempt
    attempts.push({
      timestamp: Date.now(),
      type: 'rejection'
    });
    
    // Attempt recovery
    this.recoveryStrategies.rejection(reason);
  }
  
  // Handle silent failures
  handleSilentFailure(detail) {
    console.log('Handling silent failure:', detail);
    
    // Create a failure key
    const failureKey = `${detail.componentId}:${detail.operation}:${detail.errorCode}`;
    
    // Get or create recovery history for this failure
    if (!this.recoveryAttempts.has(failureKey)) {
      this.recoveryAttempts.set(failureKey, []);
    }
    
    const attempts = this.recoveryAttempts.get(failureKey);
    
    // Check if we've tried to recover too many times
    if (attempts.length >= 3) {
      console.log('Too many recovery attempts for this failure, showing error instead');
      this.showSilentFailureMessage(detail);
      return;
    }
    
    // Record this attempt
    attempts.push({
      timestamp: Date.now(),
      type: 'silentFailure'
    });
    
    // Attempt recovery
    this.recoveryStrategies.silentFailure(detail);
  }
  
  // Recovery strategies
  recoverFromRageClick(element, elementInfo) {
    // Highlight the element
    const originalBackground = element.style.backgroundColor;
    const originalTransition = element.style.transition;
    
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = 'rgba(255, 200, 200, 0.5)';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
      
      // After highlighting, check element type and try appropriate recovery
      if (elementInfo.tagName === 'button' || 
          elementInfo.tagName === 'a' ||
          element.getAttribute('role') === 'button') {
        // For buttons or links, try to simulate a proper click
        console.log('Simulating proper click on button/link element');
        
        // Create and dispatch a proper click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        element.dispatchEvent(clickEvent);
      } else if (elementInfo.tagName === 'input' || elementInfo.tagName === 'select') {
        // For form elements, try to focus them
        console.log('Focusing form element');
        element.focus();
      } else if (elementInfo.tagName === 'form') {
        // For forms, try to find and focus the submit button
        console.log('Trying to find and focus submit button in form');
        const submitButton = element.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          submitButton.focus();
        }
      }
      
      // Reset transition
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 300);
    }, 300);
  }
  
  recoverFromNetworkError(url, error) {
    console.log('Attempting to recover from network error for:', url);
    
    // Check if we're offline
    if (!navigator.onLine) {
      this.showOfflineMessage(url);
      return;
    }
    
    // For API calls, try to retry the request
    if (url.includes('/api/')) {
      console.log('Retrying API request to:', url);
      
      // Wait a bit before retrying
      setTimeout(() => {
        fetch(url, { method: 'GET' })
          .then(response => {
            console.log('Retry succeeded!');
            // Reload the page if it's an important API call
            if (url.includes('/api/critical')) {
              window.location.reload();
            }
          })
          .catch(err => {
            console.error('Retry failed:', err);
            this.showNetworkErrorMessage(url);
          });
      }, 2000);
    } else {
      // For other resources, show a message
      this.showNetworkErrorMessage(url);
    }
  }
  
  recoverFromError(error) {
    console.log('Attempting to recover from error:', error);
    
    // Check error types and apply specific recoveries
    if (error.name === 'TypeError' && error.message.includes('undefined')) {
      // Likely a null/undefined property access
      console.log('Detected undefined property access error, attempting reload');
      window.location.reload();
    } else if (error.name === 'RangeError') {
      // Likely an infinite loop or stack overflow
      console.log('Detected range error, showing error message');
      this.showErrorMessage(error, 'We encountered a processing error. Please try again with smaller input.');
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      // JSON parsing error
      console.log('Detected JSON parsing error, refreshing data');
      // Try to refresh the current view's data
      document.dispatchEvent(new CustomEvent('refreshdata', {
        bubbles: true
      }));
    } else {
      // Generic error handling
      this.showErrorMessage(error);
    }
  }
  
  recoverFromRejection(reason) {
    console.log('Attempting to recover from rejection:', reason);
    
    // Similar to error recovery but for promises
    if (reason.name === 'TypeError' && reason.message.includes('undefined')) {
      // Likely a null/undefined property access
      console.log('Detected undefined property access rejection, attempting reload');
      window.location.reload();
    } else if (reason.name === 'AbortError') {
      // Request was aborted, probably timeout
      console.log('Detected aborted request, showing timeout message');
      this.showTimeoutMessage();
    } else {
      // Generic rejection handling
      this.showErrorMessage(reason);
    }
  }
  
  recoverFromSilentFailure(detail) {
    console.log('Attempting to recover from silent failure:', detail);
    
    // Handle specific component failures
    if (detail.componentId === 'export-button' && detail.operation === 'export') {
      console.log('Detected export operation failure, showing export help');
      
      // Find the export button
      const exportButton = document.querySelector('#export-button, [data-testid="export-button"]');
      
      if (exportButton) {
        // Show a tooltip next to the button
        this.showTooltip(
          exportButton, 
          'Export is taking longer than expected. Would you like to try a smaller export?',
          [
            { text: 'Try Smaller Export', action: 'smallerExport' },
            { text: 'Continue Waiting', action: 'wait' }
          ]
        );
      } else {
        // Fallback if button not found
        this.showExportHelp();
      }
    } else if (detail.componentId === 'data-table' && detail.operation === 'load') {
      console.log('Detected data table loading failure, retrying with pagination');
      
      // Dispatch an event to retry with pagination
      document.dispatchEvent(new CustomEvent('retrywithpagination', {
        bubbles: true,
        detail: {
          component: detail.componentId,
          pageSize: 25 // Smaller page size
        }
      }));
    } else {
      // Generic silent failure recovery
      this.showSilentFailureMessage(detail);
    }
  }
  
  // UI helpers for recovery
  showHelp(element, issueType) {
    // Create a help tooltip near the element
    const tooltip = document.createElement('div');
    tooltip.className = 'recovery-tooltip';
    tooltip.setAttribute('role', 'alert');
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '9999';
    tooltip.style.backgroundColor = '#f0f9ff';
    tooltip.style.border = '1px solid #93c5fd';
    tooltip.style.borderRadius = '4px';
    tooltip.style.padding = '10px';
    tooltip.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    tooltip.style.maxWidth = '300px';
    
    if (issueType === 'rageClick') {
      tooltip.innerHTML = `
        <h4 style="margin-top: 0; color: #1e40af;">Need help?</h4>
        <p>It seems like you're having trouble with this control. Here's what you can try:</p>
        <ul>
          <li>Wait a moment and try again</li>
          <li>Refresh the page</li>
          <li>Check your network connection</li>
        </ul>
        <button class="tooltip-close" style="background: none; border: none; position: absolute; top: 5px; right: 5px; cursor: pointer;">✕</button>
      `;
    }
    
    // Position the tooltip near the element
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    
    // Add close button handler
    document.body.appendChild(tooltip);
    tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
      document.body.removeChild(tooltip);
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    }, 10000);
  }
  
  showTooltip(element, message, actions = []) {
    // Create a tooltip near the element
    const tooltip = document.createElement('div');
    tooltip.className = 'recovery-tooltip';
    tooltip.setAttribute('role', 'alert');
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '9999';
    tooltip.style.backgroundColor = '#f0f9ff';
    tooltip.style.border = '1px solid #93c5fd';
    tooltip.style.borderRadius = '4px';
    tooltip.style.padding = '10px';
    tooltip.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    tooltip.style.maxWidth = '300px';
    
    // Create tooltip content
    let actionsHtml = '';
    if (actions.length > 0) {
      actionsHtml = '<div class="tooltip-actions" style="margin-top: 10px; display: flex; gap: 5px;">';
      actions.forEach(action => {
        actionsHtml += `<button data-action="${action.action}" style="padding: 4px 8px; background: #e0f2fe; border: 1px solid #93c5fd; border-radius: 4px; cursor: pointer;">${action.text}</button>`;
      });
      actionsHtml += '</div>';
    }
    
    tooltip.innerHTML = `
      <p style="margin: 0 0 10px 0;">${message}</p>
      ${actionsHtml}
      <button class="tooltip-close" style="background: none; border: none; position: absolute; top: 5px; right: 5px; cursor: pointer;">✕</button>
    `;
    
    // Position the tooltip near the element
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    
    // Add event listeners for actions
    document.body.appendChild(tooltip);
    
    tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
      document.body.removeChild(tooltip);
    });
    
    actions.forEach(action => {
      const button = tooltip.querySelector(`[data-action="${action.action}"]`);
      if (button) {
        button.addEventListener('click', () => {
          // Dispatch a custom event with the action
          document.dispatchEvent(new CustomEvent('recoveryaction', {
            bubbles: true,
            detail: {
              action: action.action,
              element: element
            }
          }));
          
          // Remove the tooltip
          document.body.removeChild(tooltip);
        });
      }
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    }, 15000);
  }
  
  showErrorMessage(error, customMessage = null) {
    // Create an error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-notification';
    errorContainer.setAttribute('role', 'alert');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '20px';
    errorContainer.style.right = '20px';
    errorContainer.style.backgroundColor = '#fee2e2';
    errorContainer.style.color = '#b91c1c';
    errorContainer.style.padding = '12px 16px';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    errorContainer.style.zIndex = '9999';
    errorContainer.style.maxWidth = '350px';
    
    // Error message content
    const message = customMessage || (error instanceof Error 
      ? `An error occurred: ${error.message}`
      : 'An unexpected error occurred.');
    
    errorContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">⚠️</div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">${message}</p>
          <button class="error-reload" style="background: #b91c1c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Reload Page</button>
          <button class="error-dismiss" style="background: none; border: 1px solid #b91c1c; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
        <button class="error-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(errorContainer);
    
    // Add event listeners
    errorContainer.querySelector('.error-close').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
    });
    
    errorContainer.querySelector('.error-dismiss').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
    });
    
    errorContainer.querySelector('.error-reload').addEventListener('click', () => {
      window.location.reload();
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(errorContainer)) {
        document.body.removeChild(errorContainer);
      }
    }, 20000);
  }
  
  showNetworkErrorMessage(url) {
    // Create a network error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'network-error-notification';
    errorContainer.setAttribute('role', 'alert');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '20px';
    errorContainer.style.right = '20px';
    errorContainer.style.backgroundColor = '#fef3c7';
    errorContainer.style.color = '#92400e';
    errorContainer.style.padding = '12px 16px';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    errorContainer.style.zIndex = '9999';
    errorContainer.style.maxWidth = '350px';
    
    // Error message content
    errorContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">🌐</div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">Network error occurred</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">Unable to access: ${url.substring(0, 40)}${url.length > 40 ? '...' : ''}</p>
          <button class="network-retry" style="background: #92400e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Retry</button>
          <button class="network-dismiss" style="background: none; border: 1px solid #92400e; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
        <button class="network-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(errorContainer);
    
    // Add event listeners
    errorContainer.querySelector('.network-close').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
    });
    
    errorContainer.querySelector('.network-dismiss').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
    });
    
    errorContainer.querySelector('.network-retry').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
      
      // Retry the URL
      fetch(url, { method: 'GET' })
        .then(response => {
          console.log('Manual retry succeeded!');
          // Show success message
          this.showSuccessMessage('Connection restored!');
        })
        .catch(err => {
          console.error('Manual retry failed:', err);
          // Show error again
          this.showNetworkErrorMessage(url);
        });
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(errorContainer)) {
        document.body.removeChild(errorContainer);
      }
    }, 15000);
  }
  
  showOfflineMessage() {
    // Only show if we don't already have an offline message
    if (document.querySelector('.offline-notification')) {
      return;
    }
    
    // Create an offline message
    const offlineContainer = document.createElement('div');
    offlineContainer.className = 'offline-notification';
    offlineContainer.setAttribute('role', 'alert');
    offlineContainer.style.position = 'fixed';
    offlineContainer.style.top = '20px';
    offlineContainer.style.right = '20px';
    offlineContainer.style.backgroundColor = '#e0f2fe';
    offlineContainer.style.color = '#075985';
    offlineContainer.style.padding = '12px 16px';
    offlineContainer.style.borderRadius = '4px';
    offlineContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    offlineContainer.style.zIndex = '9999';
    offlineContainer.style.maxWidth = '350px';
    
    // Offline message content
    offlineContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">📶</div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">You're offline</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">Please check your internet connection.</p>
          <button class="offline-dismiss" style="background: #075985; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
        <button class="offline-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(offlineContainer);
    
    // Add event listeners
    offlineContainer.querySelector('.offline-close').addEventListener('click', () => {
      document.body.removeChild(offlineContainer);
    });
    
    offlineContainer.querySelector('.offline-dismiss').addEventListener('click', () => {
      document.body.removeChild(offlineContainer);
    });
    
    // Add online listener to remove when back online
    const handleOnline = () => {
      if (document.body.contains(offlineContainer)) {
        document.body.removeChild(offlineContainer);
      }
      this.showSuccessMessage('You\'re back online!');
      window.removeEventListener('online', handleOnline);
    };
    
    window.addEventListener('online', handleOnline);
  }
  
  showTimeoutMessage() {
    // Create a timeout message
    const timeoutContainer = document.createElement('div');
    timeoutContainer.className = 'timeout-notification';
    timeoutContainer.setAttribute('role', 'alert');
    timeoutContainer.style.position = 'fixed';
    timeoutContainer.style.top = '20px';
    timeoutContainer.style.right = '20px';
    timeoutContainer.style.backgroundColor = '#f1f5f9';
    timeoutContainer.style.color = '#334155';
    timeoutContainer.style.padding = '12px 16px';
    timeoutContainer.style.borderRadius = '4px';
    timeoutContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    timeoutContainer.style.zIndex = '9999';
    timeoutContainer.style.maxWidth = '350px';
    
    // Timeout message content
    timeoutContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">⏱️</div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">Request timed out</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">The operation took too long to complete.</p>
          <button class="timeout-retry" style="background: #334155; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Retry</button>
          <button class="timeout-dismiss" style="background: none; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
        <button class="timeout-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(timeoutContainer);
    
    // Add event listeners
    timeoutContainer.querySelector('.timeout-close').addEventListener('click', () => {
      document.body.removeChild(timeoutContainer);
    });
    
    timeoutContainer.querySelector('.timeout-dismiss').addEventListener('click', () => {
      document.body.removeChild(timeoutContainer);
    });
    
    timeoutContainer.querySelector('.timeout-retry').addEventListener('click', () => {
      document.body.removeChild(timeoutContainer);
      
      // Dispatch a retry event
      document.dispatchEvent(new CustomEvent('retryoperation', {
        bubbles: true
      }));
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(timeoutContainer)) {
        document.body.removeChild(timeoutContainer);
      }
    }, 15000);
  }
  
  showSuccessMessage(message) {
    // Create a success message
    const successContainer = document.createElement('div');
    successContainer.className = 'success-notification';
    successContainer.setAttribute('role', 'status');
    successContainer.style.position = 'fixed';
    successContainer.style.top = '20px';
    successContainer.style.right = '20px';
    successContainer.style.backgroundColor = '#dcfce7';
    successContainer.style.color = '#166534';
    successContainer.style.padding = '12px 16px';
    successContainer.style.borderRadius = '4px';
    successContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    successContainer.style.zIndex = '9999';
    successContainer.style.maxWidth = '350px';
    
    // Success message content
    successContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">✅</div>
        <div>
          <p style="margin: 0; font-weight: 500;">${message}</p>
        </div>
        <button class="success-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(successContainer);
    
    // Add event listeners
    successContainer.querySelector('.success-close').addEventListener('click', () => {
      document.body.removeChild(successContainer);
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(successContainer)) {
        document.body.removeChild(successContainer);
      }
    }, 5000);
  }
  
  showSilentFailureMessage(detail) {
    // Create a silent failure message
    const failureContainer = document.createElement('div');
    failureContainer.className = 'silent-failure-notification';
    failureContainer.setAttribute('role', 'alert');
    failureContainer.style.position = 'fixed';
    failureContainer.style.top = '20px';
    failureContainer.style.right = '20px';
    failureContainer.style.backgroundColor = '#fef9c3';
    failureContainer.style.color = '#854d0e';
    failureContainer.style.padding = '12px 16px';
    failureContainer.style.borderRadius = '4px';
    failureContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    failureContainer.style.zIndex = '9999';
    failureContainer.style.maxWidth = '350px';
    
    // Failure message content
    let failureMessage = 'An operation failed silently.';
    
    if (detail.componentId === 'export-button' && detail.operation === 'export') {
      failureMessage = 'The export operation is taking longer than expected.';
    } else if (detail.componentId === 'data-table' && detail.operation === 'load') {
      failureMessage = 'Data table loading failed.';
    }
    
    failureContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; font-size: 20px;">🔔</div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">${failureMessage}</p>
          <button class="failure-help" style="background: #854d0e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Get Help</button>
          <button class="failure-dismiss" style="background: none; border: 1px solid #854d0e; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
        <button class="failure-close" style="background: none; border: none; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px;">✕</button>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(failureContainer);
    
    // Add event listeners
    failureContainer.querySelector('.failure-close').addEventListener('click', () => {
      document.body.removeChild(failureContainer);
    });
    
    failureContainer.querySelector('.failure-dismiss').addEventListener('click', () => {
      document.body.removeChild(failureContainer);
    });
    
    failureContainer.querySelector('.failure-help').addEventListener('click', () => {
      document.body.removeChild(failureContainer);
      
      // Show component-specific help
      if (detail.componentId === 'export-button' && detail.operation === 'export') {
        this.showExportHelp();
      } else if (detail.componentId === 'data-table' && detail.operation === 'load') {
        this.showDataTableHelp();
      } else {
        // Generic help
        this.showGenericHelp(detail);
      }
    });
    
    // Auto remove after a while
    setTimeout(() => {
      if (document.body.contains(failureContainer)) {
        document.body.removeChild(failureContainer);
      }
    }, 15000);
  }
  
  showExportHelp() {
    // Create an export help modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'help-modal';
    modalContainer.setAttribute('role', 'dialog');
    modalContainer.style.position = 'fixed';
    modalContainer.style.top = '0';
    modalContainer.style.left = '0';
    modalContainer.style.width = '100%';
    modalContainer.style.height = '100%';
    modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalContainer.style.display = 'flex';
    modalContainer.style.justifyContent = 'center';
    modalContainer.style.alignItems = 'center';
    modalContainer.style.zIndex = '10000';
    
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';
    
    modalContent.innerHTML = `
      <h2 style="margin-top: 0; color: #075985;">Export Help</h2>
      <p>The export operation is taking longer than expected. This might be due to:</p>
      <ul>
        <li>Large amount of data selected</li>
        <li>Complex data processing requirements</li>
        <li>Network connectivity issues</li>
      </ul>
      <h3 style="color: #075985;">Suggestions:</h3>
      <ol>
        <li>Try exporting a smaller subset of data</li>
        <li>Use filters to reduce the export size</li>
        <li>Try a different export format (CSV instead of Excel)</li>
        <li>Check your network connection</li>
      </ol>
      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <button class="help-smaller-export" style="background: #075985; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Try Smaller Export</button>
        <button class="help-close" style="background: none; border: 1px solid #075985; color: #075985; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    modalContent.querySelector('.help-close').addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    modalContent.querySelector('.help-smaller-export').addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      
      // Dispatch event for smaller export
      document.dispatchEvent(new CustomEvent('smallerexport', {
        bubbles: true
      }));
    });
    
    // Close when clicking outside the modal
    modalContainer.addEventListener('click', (event) => {
      if (event.target === modalContainer) {
        document.body.removeChild(modalContainer);
      }
    });
  }
  
  showDataTableHelp() {
    // Implementation similar to showExportHelp but for data table issues
    console.log('Showing data table help');
  }
  
  showGenericHelp(detail) {
    // Implementation for generic help based on detail
    console.log('Showing generic help for:', detail);
  }
}

// Export the ForensicLogger class
export default ForensicLogger;