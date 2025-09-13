import React, { useState, useRef, useEffect } from 'react';
import './JuicyChat.css';

// Chart components (using Chart.js)
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const JuicyChat = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // TBWA color palette
  const TBWA_COLORS = {
    primary: '#ff3300',
    secondary: '#002b49',
    yellow: '#FFE600',
    cyan: '#00AEEF',
    orange: '#FF6B00',
    purple: '#8A4FFF',
    green: '#00C389',
  };
  
  // Chart configuration
  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '',
      },
    },
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Add typing indicator
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: 'typing', sender: 'bot', isTyping: true },
      ]);
      
      // Call the API
      const response = await fetch('/api/juicer/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          model: 'claude',
          include_sql: true,
          use_rag: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove typing indicator
      setMessages((prevMessages) => 
        prevMessages.filter((msg) => msg.id !== 'typing')
      );
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: data.answer,
        sender: 'bot',
        timestamp: new Date(),
        data: data.data || [],
        sql: data.sql,
        charts: data.charts || [],
      };
      
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err) {
      setError(err.message);
      
      // Remove typing indicator
      setMessages((prevMessages) => 
        prevMessages.filter((msg) => msg.id !== 'typing')
      );
      
      // Add error message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${err.message}`,
          sender: 'bot',
          timestamp: new Date(),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render a chart based on configuration
  const renderChart = (chart, index) => {
    if (!chart) return null;
    
    const chartColors = [
      TBWA_COLORS.primary,
      TBWA_COLORS.secondary,
      TBWA_COLORS.cyan,
      TBWA_COLORS.yellow,
      TBWA_COLORS.orange,
      TBWA_COLORS.purple,
      TBWA_COLORS.green,
    ];
    
    const chartStyle = {
      height: '300px',
      marginTop: '15px',
      marginBottom: '15px',
    };
    
    switch (chart.type) {
      case 'bar':
        const barData = {
          labels: chart.data.map((item) => item[chart.x_axis]),
          datasets: [
            {
              label: chart.y_axis,
              data: chart.data.map((item) => item[chart.y_axis]),
              backgroundColor: chartColors[0],
            },
          ],
        };
        
        return (
          <div key={`chart-${index}`} style={chartStyle}>
            <h4>{chart.title}</h4>
            <Bar data={barData} options={{ ...chartConfig, plugins: { ...chartConfig.plugins, title: { ...chartConfig.plugins.title, text: chart.title } } }} />
          </div>
        );
        
      case 'multi-bar':
        const multiBarData = {
          labels: chart.data.map((item) => item[chart.x_axis]),
          datasets: chart.y_axes.map((metric, i) => ({
            label: metric,
            data: chart.data.map((item) => item[metric]),
            backgroundColor: chartColors[i % chartColors.length],
          })),
        };
        
        return (
          <div key={`chart-${index}`} style={chartStyle}>
            <h4>{chart.title}</h4>
            <Bar data={multiBarData} options={{ ...chartConfig, plugins: { ...chartConfig.plugins, title: { ...chartConfig.plugins.title, text: chart.title } } }} />
          </div>
        );
        
      case 'line':
        const lineData = {
          labels: chart.data.map((item) => item[chart.x_axis]),
          datasets: [
            {
              label: chart.y_axis,
              data: chart.data.map((item) => item[chart.y_axis]),
              borderColor: chartColors[2],
              backgroundColor: `${chartColors[2]}33`,
              tension: 0.3,
              fill: true,
            },
          ],
        };
        
        return (
          <div key={`chart-${index}`} style={chartStyle}>
            <h4>{chart.title}</h4>
            <Line data={lineData} options={{ ...chartConfig, plugins: { ...chartConfig.plugins, title: { ...chartConfig.plugins.title, text: chart.title } } }} />
          </div>
        );
        
      case 'pie':
        const pieData = {
          labels: chart.data.map((item) => item[chart.dimension]),
          datasets: [
            {
              data: chart.data.map((item) => item[chart.metric]),
              backgroundColor: chartColors.slice(0, chart.data.length),
            },
          ],
        };
        
        return (
          <div key={`chart-${index}`} style={chartStyle}>
            <h4>{chart.title}</h4>
            <Pie data={pieData} options={{ ...chartConfig, plugins: { ...chartConfig.plugins, title: { ...chartConfig.plugins.title, text: chart.title } } }} />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render SQL query with syntax highlighting
  const renderSql = (sql) => {
    if (!sql) return null;
    
    return (
      <div className="sql-container">
        <div className="sql-header">
          <span>SQL Query</span>
          <button 
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(sql);
              alert('SQL copied to clipboard');
            }}
          >
            Copy
          </button>
        </div>
        <pre className="sql-code">{sql}</pre>
      </div>
    );
  };
  
  // Render data table
  const renderDataTable = (data) => {
    if (!data || data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    
    return (
      <div className="data-table-container">
        <h4>Data Results</h4>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {columns.map((col) => (
                    <td key={`${rowIndex}-${col}`}>
                      {typeof row[col] === 'number' 
                        ? row[col].toLocaleString() 
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render chat message
  const renderMessage = (message) => {
    const { id, text, sender, timestamp, data, sql, charts, isTyping, error } = message;
    
    const messageClass = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    
    if (isTyping) {
      return (
        <div key="typing" className={messageClass}>
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }
    
    return (
      <div key={id} className={messageClass}>
        <div className="message-content">
          <span className="message-text">{text}</span>
          
          {/* Render charts if available */}
          {charts && charts.length > 0 && (
            <div className="charts-container">
              {charts.map((chart, index) => renderChart(chart, index))}
            </div>
          )}
          
          {/* Render SQL if available */}
          {sql && renderSql(sql)}
          
          {/* Render data table if available */}
          {data && data.length > 0 && renderDataTable(data)}
          
          {error && (
            <div className="error-container">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
        
        <div className="message-timestamp">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="juicy-chat-container">
      <div className="chat-header">
        <h2>JuicyChat</h2>
        <div className="chat-subtitle">Powered by Genie & Pulser 2.0</div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to JuicyChat!</h3>
            <p>Ask me questions about your data:</p>
            <ul>
              <li>"What's the average sentiment score for Jollibee brand mentions in the last quarter?"</li>
              <li>"Compare sales for Campaign A vs Campaign B in the NCR region"</li>
              <li>"Show me the top performing agents by conversion rate"</li>
              <li>"What insights have we generated about vegetarian menu options?"</li>
            </ul>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your data..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="chat-submit-button"
          disabled={isLoading || !inputValue.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
      
      <div className="chat-footer">
        <span>Juicer AI-BI Genie &copy; InsightPulseAI</span>
      </div>
    </div>
  );
};

export default JuicyChat;