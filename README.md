# Scout Analytics Dashboard

A comprehensive real-time analytics solution for retail businesses, providing insights into sales, product mix, consumer behavior, and AI-driven recommendations.

## Features

- **Real-time Sales Analytics**: Track sales performance across stores, regions, and time periods
- **Product Performance Tracking**: Monitor top-selling products, category performance, and inventory levels
- **Geographic Visualization**: Analyze sales data by region, city, and barangay
- **Store Management**: Manage store information and track individual store performance
- **AI-Powered Insights**: Get intelligent recommendations for inventory optimization and sales forecasting
- **Multi-tier Filtering System**: Drill down into data with hierarchical filters

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Zustand for state management
- Tailwind CSS for styling
- Recharts for data visualization
- React Query for server state management

### Backend
- Node.js with Express
- TypeScript
- MySQL 8.0 for data storage
- Docker for containerization

## Prerequisites

- Node.js 18+
- MySQL 8.0
- Docker and Docker Compose (optional)

## Installation

### Using Docker (Recommended)

1. Clone the repository
```bash
git clone https://github.com/yourusername/scout-dashboard.git
cd scout-dashboard
```

2. Create environment files
```bash
# Backend environment
cp server/.env.example server/.env
# Update the .env file with your credentials

# Frontend environment
cp client/.env.example client/.env
# Update with your API URL
```

3. Start the application
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Manual Installation

#### Backend Setup

1. Navigate to server directory
```bash
cd server
```

2. Install dependencies
```bash
npm install
```

3. Set up MySQL database
```bash
mysql -u root -p < sql/init.sql
```

4. Update `.env` file with your database credentials

5. Build and start the server
```bash
npm run build
npm start
```

#### Frontend Setup

1. Navigate to client directory
```bash
cd client
```

2. Install dependencies
```bash
npm install
```

3. Update `.env` file with API URL

4. Start development server
```bash
npm run dev
```

## Deployment

### Frontend (Vercel)

1. Install Vercel CLI
```bash
npm i -g vercel
```

2. Deploy frontend
```bash
cd client
vercel
```

3. Follow the prompts to complete deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Add your database credentials

## API Documentation

### Endpoints

#### Sales
- `GET /api/sales` - Get sales data with filters
- `GET /api/sales/summary` - Get sales summary
- `GET /api/sales/trends` - Get sales trends

#### Products
- `GET /api/products` - Get product list
- `GET /api/products/performance` - Get product performance metrics
- `GET /api/products/top` - Get top-selling products

#### Stores
- `GET /api/stores` - Get store list
- `GET /api/stores/:id` - Get store details
- `GET /api/stores/:id/performance` - Get store performance

#### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/geographic` - Get geographic analytics
- `GET /api/analytics/customers` - Get customer analytics

## Database Schema

The application uses a MySQL database with the following main tables:
- `geography` - Location hierarchy (region, city, barangay)
- `stores` - Store information
- `products` - Product catalog
- `categories` - Product categories
- `customers` - Customer data
- `sales_transactions` - Sales records
- `sales_details` - Transaction line items
- `inventory` - Stock levels
- `ai_insights` - AI-generated insights

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@scoutanalytics.ph or join our Slack channel.