import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PromptsMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [activePrompt, setActivePrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Color palette for charts
  const colors = [
    'rgba(75, 192, 192, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(255, 99, 255, 0.6)',
    'rgba(99, 255, 132, 0.6)',
  ];

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics
      const metricsResponse = await fetch('/api/claudia/metrics');
      if (!metricsResponse.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsResponse.statusText}`);
      }
      const metricsData = await metricsResponse.json();
      
      // Fetch prompts list
      const promptsResponse = await fetch('/api/ai/prompts?include_metadata=true');
      if (!promptsResponse.ok) {
        throw new Error(`Failed to fetch prompts: ${promptsResponse.statusText}`);
      }
      const promptsData = await promptsResponse.json();
      
      setMetrics(metricsData);
      setPrompts(promptsData.prompts);
      setActivePrompt(promptsData.active_prompt || '');
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();
    
    // Set up polling based on refresh interval
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Prepare data for Requests by Prompt chart
  const prepareRequestsData = () => {
    if (!metrics?.metrics?.requests_by_prompt) return null;
    
    const requestsByPrompt = metrics.metrics.requests_by_prompt;
    const labels = Object.keys(requestsByPrompt);
    const data = labels.map(key => requestsByPrompt[key]);
    
    return {
      labels,
      datasets: [
        {
          label: 'Requests',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for Errors by Prompt chart
  const prepareErrorsData = () => {
    if (!metrics?.metrics?.errors_by_prompt) return null;
    
    const errorsByPrompt = metrics.metrics.errors_by_prompt;
    const labels = Object.keys(errorsByPrompt);
    const data = labels.map(key => errorsByPrompt[key]);
    
    return {
      labels,
      datasets: [
        {
          label: 'Errors',
          data,
          backgroundColor: colors.slice(0, labels.length).map(color => color.replace('0.6', '0.8')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Requests by Prompt',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Errors by Prompt',
      },
    },
  };

  return (
    <div className="prompts-monitor">
      <h1>MCP Prompts Monitoring Dashboard</h1>
      
      <div className="controls">
        <button 
          onClick={fetchMetrics} 
          disabled={loading}
          className="refresh-button"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        
        <div className="interval-control">
          <label htmlFor="refresh-interval">Auto-refresh (seconds):</label>
          <input
            id="refresh-interval"
            type="number"
            min="5"
            max="300"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          />
        </div>
        
        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div className="metrics-overview">
        <div className="metric-card">
          <h3>Total Requests</h3>
          <p className="metric-value">{metrics?.metrics?.total_requests || 0}</p>
        </div>
        
        <div className="metric-card">
          <h3>Active Prompt</h3>
          <p className="metric-value">{activePrompt || 'None'}</p>
        </div>
        
        <div className="metric-card">
          <h3>Available Prompts</h3>
          <p className="metric-value">{prompts?.length || 0}</p>
        </div>
        
        <div className="metric-card">
          <h3>Session ID</h3>
          <p className="metric-value">{metrics?.session_id || 'None'}</p>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-wrapper">
          {prepareRequestsData() ? (
            <Bar data={prepareRequestsData()} options={barOptions} />
          ) : (
            <div className="no-data">No request data available</div>
          )}
        </div>
        
        <div className="chart-wrapper">
          {prepareErrorsData() ? (
            <Pie data={prepareErrorsData()} options={pieOptions} />
          ) : (
            <div className="no-data">No error data available</div>
          )}
        </div>
      </div>
      
      <div className="prompts-list">
        <h2>Available Prompts</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Access Level</th>
              <th>Aliases</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt, index) => (
              <tr key={index} className={prompt.active ? 'active-prompt' : ''}>
                <td>{prompt.name}</td>
                <td>{prompt.metadata?.description || 'No description'}</td>
                <td>
                  <span className={`access-level ${prompt.access_level || 'internal'}`}>
                    {prompt.access_level || 'internal'}
                  </span>
                </td>
                <td>
                  {prompt.metadata?.aliases?.join(', ') || 'None'}
                </td>
                <td>{prompt.active ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style jsx>{`
        .prompts-monitor {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }
        
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .refresh-button {
          padding: 8px 16px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .refresh-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .interval-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .interval-control input {
          width: 60px;
          padding: 4px;
        }
        
        .error-message {
          padding: 10px;
          background-color: #ffecec;
          color: #f44336;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .metrics-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metric-card h3 {
          margin-top: 0;
          color: #666;
          font-size: 16px;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0 0;
          color: #333;
        }
        
        .charts-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .chart-wrapper {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: 300px;
        }
        
        .no-data {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-style: italic;
        }
        
        .prompts-list {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-x: auto;
        }
        
        .prompts-list h2 {
          margin-top: 0;
          color: #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        tr.active-prompt {
          background-color: #e6f7ff;
        }
        
        .access-level {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .access-level.public {
          background-color: #e6f7e6;
          color: #28a745;
        }
        
        .access-level.beta {
          background-color: #fff3e0;
          color: #ff9800;
        }
        
        .access-level.internal {
          background-color: #ffecec;
          color: #f44336;
        }
      `}</style>
    </div>
  );
};

export default PromptsMonitor;