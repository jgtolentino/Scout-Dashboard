# Scout Dashboard

A modern, Power BI-style React dashboard for visualizing retail transaction data from sari-sari stores (SSS). Built with React, TypeScript, and Azure services.

## 🚀 Features

- **Real-time Analytics**: Live data visualization with sub-second response times
- **Multi-dimensional Analysis**: Sales, brand performance, store metrics, and product insights
- **AI-Powered Insights**: Machine learning-driven recommendations and anomaly detection
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Enterprise Security**: Azure AD B2C authentication and role-based access control
- **Scalable Architecture**: Serverless backend with Azure Functions and SQL Database

## 📊 Dashboard Modules

1. **Overview Dashboard**: Key metrics and KPIs at a glance
2. **Sales Analytics**: Detailed sales trends and performance analysis
3. **Brand Performance**: Brand comparison and market share visualization
4. **Store Metrics**: Geographic distribution and store performance heatmaps
5. **Product Insights**: Product category analysis and inventory optimization
6. **AI Recommendations**: Predictive analytics and optimization suggestions

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Redux Toolkit for state management
- Material-UI (MUI) for UI components
- Recharts & D3.js for data visualization
- Vite for fast development and building

### Backend
- Azure Functions (Serverless)
- Azure SQL Database
- Azure Databricks for ETL
- Azure AD B2C for authentication

### Infrastructure
- Azure Static Web Apps for hosting
- Azure Front Door for CDN
- GitHub Actions for CI/CD
- Terraform for infrastructure as code

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Azure subscription
- Azure CLI installed
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/scout-dashboard.git
cd scout-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/local.settings.example.json backend/local.settings.json
```

4. Configure your Azure resources and update the environment files with your credentials.

### Development

Run the frontend development server:
```bash
npm run dev
```

Run the backend locally:
```bash
cd backend
npm run dev
```

### Building for Production

```bash
npm run build
```

## 📁 Project Structure

```
scout-dashboard/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/      # Redux store
│   │   └── services/   # API services
├── backend/            # Azure Functions
│   ├── functions/
│   └── shared/
├── infrastructure/     # Terraform configs
├── database/          # SQL scripts
└── docs/              # Documentation
```

## 🔐 Security

- All API endpoints require authentication
- Data is encrypted in transit and at rest
- Regular security audits with automated scanning
- RBAC implementation for fine-grained access control

## 📈 Performance

- Optimized for 1000+ concurrent users
- Sub-second response times for most queries
- Efficient caching strategies
- Progressive web app capabilities

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@scout-dashboard.com or create an issue in this repository.