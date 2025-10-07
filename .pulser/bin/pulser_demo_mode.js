/**
 * Pulser CLI Demo Mode Functions
 * 
 * This file contains functions to enable demo mode in the Pulser CLI,
 * which allows testing the CLI interface without requiring API keys.
 */

// Generate a demo response based on the input
function generateDemoResponse(input, options) {
  // For debugging
  console.log(`Demo input: "${input}"`);

  const lowercaseInput = input.toLowerCase();
  
  // Hello/greeting response
  if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi ')) {
    return `Hello! I'm the Pulser CLI running in demo mode. This is a simulated response to demonstrate the interface without requiring API keys.
    
To use the real API, you'll need to set up API keys using one of these methods:
1. Use the setup script: ./setup_real_pulser_api.sh
2. Edit ~/.pulser/config/api_keys.json
3. Set the appropriate environment variables

For more information, see the PULSER_CLI_GUIDE.md file.`;
  }
  
  // Help response
  if (lowercaseInput.includes('help') || lowercaseInput.includes('guide')) {
    return `# Pulser CLI Help

The Pulser CLI supports multiple providers and features:

## Providers:
- Anthropic (Claude models)
- OpenAI (GPT models)
- Local models via Ollama

## Key Features:
- Smart paste detection
- Provider switching
- Interactive mode with slash commands
- Single-shot mode for scripting

See PULSER_CLI_GUIDE.md for complete documentation.`;
  }
  
  // Code example response
  if (lowercaseInput.includes('code') || lowercaseInput.includes('example') || lowercaseInput.includes('script')) {
    return `Here's a simple JavaScript example:

\`\`\`javascript
// Sample function that demonstrates arrow syntax
const processData = (data) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid data format');
  }
  
  return data
    .filter(item => item && item.active)
    .map(item => ({
      id: item.id,
      name: item.name.toUpperCase(),
      score: (item.score * 1.1).toFixed(2)
    }))
    .sort((a, b) => b.score - a.score);
};

// Example usage
const sampleData = [
  { id: 1, name: 'alpha', score: 85, active: true },
  { id: 2, name: 'beta', score: 92, active: true },
  { id: 3, name: 'gamma', score: 78, active: false },
  { id: 4, name: 'delta', score: 95, active: true }
];

console.log(processData(sampleData));
\`\`\`

This function processes an array of data items by:
1. Filtering out inactive items
2. Transforming the data (uppercase names, increase scores by 10%)
3. Sorting by score in descending order`;
  }
  
  // SQL example
  if (lowercaseInput.includes('sql') || lowercaseInput.includes('database') || lowercaseInput.includes('query')) {
    return `Here's a SQL example that demonstrates common query patterns:

\`\`\`sql
-- Example of a complex SQL query with joins, grouping, and window functions
WITH customer_orders AS (
  SELECT 
    c.customer_id,
    c.name,
    c.email,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    MAX(o.order_date) AS last_order_date,
    AVG(o.total_amount) AS avg_order_value
  FROM customers c
  LEFT JOIN orders o ON c.customer_id = o.customer_id
  WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
  GROUP BY c.customer_id, c.name, c.email
)

SELECT 
  co.*,
  RANK() OVER (ORDER BY total_spent DESC) AS spending_rank,
  NTILE(4) OVER (ORDER BY total_spent DESC) AS spending_quartile,
  CASE 
    WHEN total_orders > 10 THEN 'High'
    WHEN total_orders > 5 THEN 'Medium'
    ELSE 'Low'
  END AS engagement_level
FROM customer_orders co
WHERE total_orders > 0
ORDER BY total_spent DESC
LIMIT 100;
\`\`\`

This query:
1. Creates a CTE to aggregate customer order data
2. Applies window functions to rank customers
3. Adds a derived engagement level column
4. Filters and sorts the results`;
  }
  
  // Configuration example
  if (lowercaseInput.includes('config') || lowercaseInput.includes('json') || lowercaseInput.includes('yaml')) {
    return `Here's a sample configuration file example:

\`\`\`yaml
# Pulser Configuration Example
version: 2.1

providers:
  anthropic:
    default_model: claude-3-opus-20240229
    timeout: 60000
    max_tokens: 4096
    temperature: 0.7
  
  openai:
    default_model: gpt-4o
    timeout: 30000
    max_tokens: 2048
    temperature: 0.8
    
  local:
    default_model: llama2
    timeout: 30000
    hostname: localhost
    port: 11434

interface:
  theme: dark
  colors:
    primary: '#4a9eff'
    secondary: '#50e3c2'
    accent: '#ff6b6b'
    
  features:
    paste_detection: true
    syntax_highlighting: true
    auto_complete: true
    
  keyboard_shortcuts:
    submit: 'Ctrl+Enter'
    clear: 'Ctrl+L'
    exit: 'Ctrl+D'

history:
  max_entries: 100
  save_path: '~/.pulser/history/'
  encryption: true
\`\`\`

This configuration file demonstrates:
1. Provider-specific settings
2. UI theme and color customization
3. Feature toggles
4. Keyboard shortcut definitions
5. History management settings`;
  }
  
  // Default response for other inputs
  return `This is a demo response from the Pulser CLI. You entered: "${input}"

In demo mode, the CLI simulates responses without making actual API calls. This allows you to test the interface and features without needing to set up API keys.

To use the real API functionality, you need to:
1. Get API keys from Anthropic or OpenAI
2. Configure them using the setup script or manually
3. Run without the --demo flag

Try asking about "help", "code examples", "sql queries", "configuration", or just say "hello" to see different demo responses.`;
}

// Export the function
export { generateDemoResponse };