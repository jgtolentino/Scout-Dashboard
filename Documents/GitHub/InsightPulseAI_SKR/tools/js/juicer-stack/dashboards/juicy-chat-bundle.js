/**
 * JuicyChat Bundle
 * 
 * This is a self-contained bundle that can be included in any dashboard to add
 * natural language querying capabilities. It creates a floating chat button
 * that expands into a full chat interface when clicked.
 * 
 * Usage:
 * 1. Include this script in your dashboard HTML
 * 2. Add a div with id="juicy-chat-container" where you want the chat to appear
 * 3. Initialize with JuicyChat.init({apiEndpoint: '/api/juicer/query', dashboardContext: {...}})
 */

(function() {
  'use strict';
  
  // Create namespace
  window.JuicyChat = window.JuicyChat || {};
  
  // Configuration
  const DEFAULT_CONFIG = {
    apiEndpoint: '/api/juicer/query',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    theme: 'tbwa',
    initialMessage: 'Ask me about your data!',
    placeholder: 'Ask a question about your data...',
    model: 'claude',
    dashboardContext: null
  };
  
  // State
  let config = { ...DEFAULT_CONFIG };
  let isOpen = false;
  let messages = [];
  let chatContainer = null;
  let chatButton = null;
  let chatPanel = null;
  
  // TBWA color palette (can be customized via config)
  const TBWA_COLORS = {
    primary: '#ff3300',
    secondary: '#002b49',
    yellow: '#FFE600',
    cyan: '#00AEEF',
    orange: '#FF6B00',
    purple: '#8A4FFF',
    green: '#00C389'
  };
  
  // Init function
  JuicyChat.init = function(customConfig = {}) {
    // Merge configs
    config = { ...DEFAULT_CONFIG, ...customConfig };
    
    // Create styles
    createStyles();
    
    // Create UI components
    createUI();
    
    // Add event listeners
    addEventListeners();
    
    // Add welcome message if no messages
    if (messages.length === 0) {
      addWelcomeMessage();
    }
    
    console.log('JuicyChat initialized with config:', config);
    return this;
  };
  
  // Create global CSS styles
  function createStyles() {
    const styleElement = document.createElement('style');
    styleElement.id = 'juicy-chat-styles';
    styleElement.textContent = `
      /* JuicyChat Styles */
      .juicy-chat-button {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${TBWA_COLORS.primary};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s, background-color 0.3s;
        z-index: 9998;
      }
      
      .juicy-chat-button:hover {
        transform: scale(1.05);
        background-color: #e62e00;
      }
      
      .juicy-chat-button.bottom-right {
        right: 30px;
        bottom: 30px;
      }
      
      .juicy-chat-button.bottom-left {
        left: 30px;
        bottom: 30px;
      }
      
      .juicy-chat-button.top-right {
        right: 30px;
        top: 30px;
      }
      
      .juicy-chat-button.top-left {
        left: 30px;
        top: 30px;
      }
      
      .juicy-chat-button svg {
        width: 30px;
        height: 30px;
      }
      
      .juicy-chat-panel {
        position: fixed;
        width: 400px;
        height: 600px;
        background-color: #f5f7fb;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 9999;
        transition: transform 0.3s, opacity 0.3s;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        overflow: hidden;
      }
      
      .juicy-chat-panel.visible {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
      
      .juicy-chat-panel.bottom-right {
        right: 30px;
        bottom: 100px;
      }
      
      .juicy-chat-panel.bottom-left {
        left: 30px;
        bottom: 100px;
      }
      
      .juicy-chat-panel.top-right {
        right: 30px;
        top: 100px;
      }
      
      .juicy-chat-panel.top-left {
        left: 30px;
        top: 100px;
      }
      
      .juicy-chat-header {
        background-color: ${TBWA_COLORS.secondary};
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      }
      
      .juicy-chat-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .juicy-chat-header .close-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        line-height: 1;
      }
      
      .juicy-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .juicy-chat-input-container {
        padding: 15px;
        border-top: 1px solid #e1e4ea;
        background-color: white;
        display: flex;
      }
      
      .juicy-chat-input {
        flex: 1;
        padding: 12px 15px;
        border: 1px solid #ddd;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
      }
      
      .juicy-chat-input:focus {
        border-color: ${TBWA_COLORS.primary};
      }
      
      .juicy-chat-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${TBWA_COLORS.primary};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        margin-left: 10px;
        cursor: pointer;
      }
      
      .juicy-chat-send:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      
      .juicy-chat-message {
        display: flex;
        flex-direction: column;
        max-width: 85%;
      }
      
      .juicy-chat-message.user {
        align-self: flex-end;
      }
      
      .juicy-chat-message.bot {
        align-self: flex-start;
      }
      
      .juicy-chat-message-content {
        padding: 12px 16px;
        border-radius: 18px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .juicy-chat-message.user .juicy-chat-message-content {
        background-color: ${TBWA_COLORS.secondary};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .juicy-chat-message.bot .juicy-chat-message-content {
        background-color: white;
        color: #333;
        border-bottom-left-radius: 4px;
      }
      
      .juicy-chat-message-timestamp {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
        align-self: flex-end;
      }
      
      .juicy-chat-message.user .juicy-chat-message-timestamp {
        margin-right: 4px;
      }
      
      .juicy-chat-message.bot .juicy-chat-message-timestamp {
        margin-left: 4px;
        align-self: flex-start;
      }
      
      .juicy-chat-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
      }
      
      .juicy-chat-typing span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ccc;
        display: inline-block;
        animation: juicyChatTyping 1.4s infinite ease-in-out both;
      }
      
      .juicy-chat-typing span:nth-child(1) {
        animation-delay: 0s;
      }
      
      .juicy-chat-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .juicy-chat-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes juicyChatTyping {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.6; }
        40% { transform: scale(1.2); opacity: 1; }
      }
      
      .juicy-chart-container {
        margin-top: 10px;
        height: 200px;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 10px;
        border: 1px solid #eee;
      }
      
      .juicy-chat-sql {
        margin-top: 10px;
        padding: 10px;
        background-color: #f1f5f9;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        overflow-x: auto;
        border: 1px solid #e1e4ea;
        white-space: pre;
      }
      
      .juicy-chat-welcome {
        background-color: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .juicy-chat-welcome h4 {
        color: ${TBWA_COLORS.secondary};
        margin-top: 0;
        margin-bottom: 10px;
      }
      
      .juicy-chat-welcome p {
        margin-bottom: 15px;
      }
      
      .juicy-chat-welcome ul {
        padding-left: 20px;
        margin-bottom: 0;
      }
      
      .juicy-chat-welcome li {
        margin-bottom: 8px;
        color: #555;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  // Create UI components
  function createUI() {
    // Find or create container
    chatContainer = document.getElementById('juicy-chat-container');
    if (!chatContainer) {
      chatContainer = document.createElement('div');
      chatContainer.id = 'juicy-chat-container';
      document.body.appendChild(chatContainer);
    }
    
    // Create chat button
    chatButton = document.createElement('div');
    chatButton.className = `juicy-chat-button ${config.position}`;
    chatButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    chatContainer.appendChild(chatButton);
    
    // Create chat panel
    chatPanel = document.createElement('div');
    chatPanel.className = `juicy-chat-panel ${config.position}`;
    chatPanel.innerHTML = `
      <div class="juicy-chat-header">
        <h3>Juicer Chat</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="juicy-chat-messages"></div>
      <div class="juicy-chat-input-container">
        <input type="text" class="juicy-chat-input" placeholder="${config.placeholder}">
        <button class="juicy-chat-send" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;
    chatContainer.appendChild(chatPanel);
  }
  
  // Add event listeners
  function addEventListeners() {
    // Toggle chat open/closed
    chatButton.addEventListener('click', toggleChat);
    
    // Close button
    const closeButton = chatPanel.querySelector('.close-button');
    closeButton.addEventListener('click', toggleChat);
    
    // Send button and input
    const sendButton = chatPanel.querySelector('.juicy-chat-send');
    const input = chatPanel.querySelector('.juicy-chat-input');
    
    input.addEventListener('input', () => {
      sendButton.disabled = !input.value.trim();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        sendMessage(input.value);
        input.value = '';
        sendButton.disabled = true;
      }
    });
    
    sendButton.addEventListener('click', () => {
      if (input.value.trim()) {
        sendMessage(input.value);
        input.value = '';
        sendButton.disabled = true;
      }
    });
  }
  
  // Toggle chat panel visibility
  function toggleChat() {
    isOpen = !isOpen;
    chatPanel.classList.toggle('visible', isOpen);
    
    // Scroll to bottom when opening
    if (isOpen) {
      scrollToBottom();
    }
  }
  
  // Add welcome message
  function addWelcomeMessage() {
    const messagesContainer = chatPanel.querySelector('.juicy-chat-messages');
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'juicy-chat-welcome';
    welcomeDiv.innerHTML = `
      <h4>Welcome to JuicyChat!</h4>
      <p>Ask me questions about your data:</p>
      <ul>
        <li>How many brand mentions did Jollibee get last quarter?</li>
        <li>Compare sales for Campaign A vs B in NCR region</li>
        <li>Show me the top performing agents by conversion rate</li>
        <li>What insights have we gathered about vegetarian options?</li>
      </ul>
    `;
    messagesContainer.appendChild(welcomeDiv);
  }
  
  // Send a message
  function sendMessage(text) {
    // Add user message
    addMessage(text, 'user');
    
    // Add typing indicator
    const messagesContainer = chatPanel.querySelector('.juicy-chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'juicy-chat-message bot';
    typingDiv.innerHTML = `
      <div class="juicy-chat-message-content juicy-chat-typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    
    // Call API
    const payload = {
      query: text,
      model: config.model,
      include_sql: true,
      use_rag: true
    };
    
    // Add dashboard context if available
    if (config.dashboardContext) {
      payload.context = config.dashboardContext;
    }
    
    fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Remove typing indicator
      messagesContainer.removeChild(typingDiv);
      
      // Add bot response
      addMessage(data.answer, 'bot', data);
    })
    .catch(error => {
      // Remove typing indicator
      messagesContainer.removeChild(typingDiv);
      
      // Add error message
      addMessage(`Sorry, I encountered an error: ${error.message}`, 'bot');
    });
  }
  
  // Add a message to the chat
  function addMessage(text, sender, data = null) {
    const messagesContainer = chatPanel.querySelector('.juicy-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `juicy-chat-message ${sender}`;
    
    let messageContent = `
      <div class="juicy-chat-message-content">
        ${text}
      </div>
      <div class="juicy-chat-message-timestamp">
        ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    `;
    
    // Add SQL if available
    if (data && data.sql) {
      messageContent = messageContent.replace('</div>', `
        <div class="juicy-chat-sql">${data.sql}</div>
        </div>
      `);
    }
    
    // Add chart placeholder if available
    if (data && data.charts && data.charts.length > 0) {
      for (let i = 0; i < Math.min(data.charts.length, 2); i++) {
        const chart = data.charts[i];
        messageContent = messageContent.replace('</div>', `
          <div class="juicy-chart-container" data-chart='${JSON.stringify(chart)}'>
            <div>Chart: ${chart.title}</div>
          </div>
          </div>
        `);
      }
    }
    
    messageDiv.innerHTML = messageContent;
    messagesContainer.appendChild(messageDiv);
    
    // Store message
    messages.push({
      text,
      sender,
      timestamp: new Date(),
      data
    });
    
    // Scroll to bottom
    scrollToBottom();
    
    return messageDiv;
  }
  
  // Scroll to bottom of messages
  function scrollToBottom() {
    const messagesContainer = chatPanel.querySelector('.juicy-chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Public methods
  JuicyChat.open = function() {
    if (!isOpen) {
      toggleChat();
    }
  };
  
  JuicyChat.close = function() {
    if (isOpen) {
      toggleChat();
    }
  };
  
  JuicyChat.sendMessage = function(text) {
    if (!isOpen) {
      toggleChat();
    }
    sendMessage(text);
  };
  
  JuicyChat.updateConfig = function(newConfig) {
    Object.assign(config, newConfig);
  };
  
  // Initialize on load if autoInit is true
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (window.JuicyChatConfig && window.JuicyChatConfig.autoInit) {
        JuicyChat.init(window.JuicyChatConfig);
      }
    });
  } else {
    if (window.JuicyChatConfig && window.JuicyChatConfig.autoInit) {
      JuicyChat.init(window.JuicyChatConfig);
    }
  }
})();