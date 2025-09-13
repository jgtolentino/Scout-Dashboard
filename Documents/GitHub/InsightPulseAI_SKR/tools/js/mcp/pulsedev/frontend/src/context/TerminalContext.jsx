import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { WorkspaceContext } from './WorkspaceContext';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

// Create context
export const TerminalContext = createContext();

export const TerminalProvider = ({ children }) => {
  const { workspace } = useContext(WorkspaceContext);
  const [sessions, setSessions] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
  
  const terminalInstances = useRef({});
  const socketInstances = useRef({});
  
  // Create a new terminal session
  const createSession = async () => {
    if (!workspace?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/terminal/${workspace.id}/sessions`);
      const session = response.data;
      
      // Add to sessions state
      setSessions(prev => ({
        ...prev,
        [session.id]: session
      }));
      
      // Set as active session if none is active
      if (!activeSession) {
        setActiveSession(session.id);
      }
      
      return session;
    } catch (error) {
      console.error('Error creating terminal session:', error);
      setError(error.message || 'Failed to create terminal session');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Terminate a terminal session
  const terminateSession = async (sessionId) => {
    if (!sessionId) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/terminal/sessions/${sessionId}`);
      
      // Remove from sessions state
      setSessions(prev => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });
      
      // If this was the active session, set a new active session
      if (activeSession === sessionId) {
        const sessionIds = Object.keys(sessions);
        if (sessionIds.length > 0) {
          setActiveSession(sessionIds[0]);
        } else {
          setActiveSession(null);
        }
      }
      
      // Close WebSocket if open
      if (socketInstances.current[sessionId]) {
        socketInstances.current[sessionId].close();
        delete socketInstances.current[sessionId];
      }
      
      return true;
    } catch (error) {
      console.error(`Error terminating terminal session ${sessionId}:`, error);
      setError(error.message || 'Failed to terminate terminal session');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize a terminal instance
  const initializeTerminal = (sessionId, container) => {
    if (!sessionId || !container) return null;
    
    // Create terminal instance if it doesn't exist
    if (!terminalInstances.current[sessionId]) {
      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5'
        },
        fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        scrollback: 5000,
        allowTransparency: true
      });
      
      // Add addons
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      
      // Open terminal in container
      term.open(container);
      fitAddon.fit();
      
      // Store in ref
      terminalInstances.current[sessionId] = {
        term,
        fitAddon
      };
      
      // Connect WebSocket
      connectWebSocket(sessionId, term);
      
      // Handle user input
      term.onData(data => {
        const socket = socketInstances.current[sessionId];
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'input',
            data
          }));
        }
      });
      
      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        
        // Send terminal size to server
        const socket = socketInstances.current[sessionId];
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows
          }));
        }
      });
      
      resizeObserver.observe(container);
      
      // Add welcome message
      term.writeln('\x1b[1;32mWelcome to PulseDev Terminal!\x1b[0m');
      term.writeln('Type \x1b[1mhelp\x1b[0m for available commands.');
      term.writeln('');
    } else {
      // Terminal instance already exists, just fit it to container
      const { term, fitAddon } = terminalInstances.current[sessionId];
      
      if (container.contains(term.element)) {
        // Terminal is already in this container, just fit it
        fitAddon.fit();
      } else {
        // Move terminal to this container
        if (term.element.parentElement) {
          term.element.parentElement.removeChild(term.element);
        }
        container.appendChild(term.element);
        fitAddon.fit();
      }
    }
    
    return terminalInstances.current[sessionId].term;
  };
  
  // Connect to WebSocket for terminal session
  const connectWebSocket = (sessionId, term) => {
    const socket = new WebSocket(`${WS_URL}/terminal/${sessionId}`);
    
    socket.onopen = () => {
      console.log(`Terminal WebSocket connected for session ${sessionId}`);
      setStatus('connected');
      
      // Send terminal size
      socket.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows
      }));
      
      // Setup ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      socketInstances.current[sessionId] = {
        socket,
        pingInterval
      };
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'output') {
          term.write(message.data);
        } else if (message.type === 'pong') {
          // Ping response, do nothing
        } else if (message.type === 'error') {
          console.error('Terminal error:', message.message);
          term.writeln(`\r\n\x1b[1;31mError: ${message.message}\x1b[0m\r\n`);
        }
      } catch (error) {
        console.error('Error parsing terminal message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error(`Terminal WebSocket error for session ${sessionId}:`, error);
      setStatus('error');
      term.writeln(`\r\n\x1b[1;31mWebSocket error. Terminal connection lost.\x1b[0m\r\n`);
    };
    
    socket.onclose = () => {
      console.log(`Terminal WebSocket closed for session ${sessionId}`);
      setStatus('disconnected');
      term.writeln(`\r\n\x1b[1;33mTerminal connection closed.\x1b[0m\r\n`);
      
      // Clear ping interval
      if (socketInstances.current[sessionId]?.pingInterval) {
        clearInterval(socketInstances.current[sessionId].pingInterval);
      }
      
      // Remove from instances
      delete socketInstances.current[sessionId];
    };
    
    return socket;
  };
  
  // Execute a command
  const executeCommand = (command) => {
    if (!activeSession) return;
    
    const instance = terminalInstances.current[activeSession];
    if (!instance) return;
    
    const { term } = instance;
    
    // Write command to terminal
    term.write('\r\n');
    
    // Send to server via WebSocket
    const socket = socketInstances.current[activeSession];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'execute',
        command
      }));
    } else {
      term.writeln(`\x1b[1;31mTerminal disconnected. Cannot execute command.\x1b[0m\r\n`);
    }
  };
  
  // Load all terminal sessions for the current workspace
  const loadSessions = async () => {
    if (!workspace?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/terminal/${workspace.id}/sessions`);
      
      // Create sessions map
      const sessionsMap = {};
      response.data.forEach(session => {
        sessionsMap[session.id] = session;
      });
      
      setSessions(sessionsMap);
      
      // Set active session if there are any sessions
      if (response.data.length > 0 && !activeSession) {
        setActiveSession(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading terminal sessions:', error);
      setError(error.message || 'Failed to load terminal sessions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Close all WebSockets
      Object.entries(socketInstances.current).forEach(([sessionId, { socket, pingInterval }]) => {
        clearInterval(pingInterval);
        socket.close();
      });
      
      // Clean up terminal instances
      Object.entries(terminalInstances.current).forEach(([sessionId, { term }]) => {
        term.dispose();
      });
    };
  }, []);
  
  // Create a session when workspace changes
  useEffect(() => {
    if (workspace?.id) {
      // Load existing sessions
      loadSessions();
    } else {
      // Clear sessions when workspace is not set
      setSessions({});
      setActiveSession(null);
    }
  }, [workspace?.id]);
  
  return (
    <TerminalContext.Provider
      value={{
        sessions,
        activeSession,
        status,
        isLoading,
        error,
        createSession,
        terminateSession,
        setActiveSession,
        initializeTerminal,
        executeCommand
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};