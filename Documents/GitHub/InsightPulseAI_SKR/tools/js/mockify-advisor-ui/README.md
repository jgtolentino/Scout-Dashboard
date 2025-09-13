# Project Scout Advisor UI

## Project Overview

Project Scout Advisor UI is a data visualization and analytics dashboard for retail insights. It features AI-powered assistant capabilities, data connectors, and role-based access control.

## Features

### Dashboard Components
- **KPI Cards**: Key performance metrics with trend indicators
- **Insight Cards**: AI-generated insights with detailed views
- **Data Source Toggle**: Switch between simulated, real, and hybrid data
- **Role-based Views**: Different data views for client and internal users

### Assistant Tools
- **GPT Action Plans**: AI-generated action plans based on insights
- **PDF Export**: Export action plans as formatted PDF documents
- **LLM Pricing Calculator**: Token-based cost calculator for various LLM models
- **LLM Pricing Test Suite**: Comprehensive testing framework for pricing calculations

### Data Architecture
- **Medallion Data Connector**: Tiered data approach (bronze/silver/gold/platinum)
- **Data Freshness Indicators**: Visual indicators for data recency

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- React Router
- shadcn-ui Components
- Tailwind CSS
- Recharts for data visualization

## Pages

- `/` - Main Dashboard
- `/advisor` - Advisor Dashboard
- `/insight-test` - Test page for insight cards and modals
- `/gpt-test` - Test page for GPT action plans
- `/llm-pricing` - LLM Pricing Calculator & Test Suite
- `/theme-audit` - Theme and Accessibility Guide
- `/settings` - User settings and preferences

## Getting Started

```sh
# Step 1: Clone the repository
git clone <repository-url>

# Step 2: Navigate to the project directory
cd mockify-advisor-ui

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## LLM Pricing Calculator

The LLM Pricing Calculator provides utilities to optimize costs when working with large language models:

- **Cost Calculation**: Per-request cost based on token usage
- **Model Comparison**: Compare costs across different models
- **Optimization Features**: Support for prompt caching and batch processing
- **Usage Tracking**: Monitor LLM usage and project monthly costs
- **Recommendations**: Get personalized cost-saving tips

📄 **Documentation**: 
- [LLM Pricing Optimizer Overview](PRICING_OPTIMIZER.md)
- [Technical Implementation Details](docs/PRICING_IMPLEMENTATION.md)
- [Test Suite Guide](docs/PRICING_TEST_GUIDE.md)
- [Interactive Demo](/llm-pricing)

### Pricing Reference (per 1K tokens)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4.1 | $2.00 | $8.00 |
| GPT-4.1 nano | $0.10 | $0.40 |
| GPT-4o mini | $0.15 | $0.60 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| o-series (reasoning) | $1.10 | $60.00 |

**Token Math Example**:
```
[(Input tokens × rate) + (Output tokens × rate)] ÷ 1,000
```

Example: 200 input + 900 output with GPT-4o mini = (200 × $0.15 + 900 × $0.60) ÷ 1000 = $0.59

## Theme & Accessibility

The UI includes:

- Consistent color schemes and typography
- Keyboard navigation support
- ARIA attributes for screen readers
- Focus indicators and hover states
- Standardized component styles

To review the theme and accessibility guidelines, visit the `/theme-audit` page.