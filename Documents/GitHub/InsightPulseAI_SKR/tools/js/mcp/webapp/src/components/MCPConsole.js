import React, { useRef, useEffect } from 'react';
import './MCPConsole.css';

const MCPConsole = ({ messages = [] }) => {
  const consoleRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <div className="mcp-console">
      <div className="console-header">
        <span>MCP System Console</span>
      </div>
      
      <div className="console-content" ref={consoleRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Create a robot to see MCP commands and responses.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message message-${msg.type}`}>
              <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
              <span className="content">{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MCPConsole;