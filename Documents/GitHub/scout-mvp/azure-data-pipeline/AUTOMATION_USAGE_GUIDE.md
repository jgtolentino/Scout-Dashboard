# 🚀 Scout Dashboard v4.0 Azure - Automation Usage Guide

**Complete automation package for creating a production-ready Scout Retail Dashboard**

---

## 📋 Quick Start

### One-Command Setup
```bash
# Run the complete automation
./scripts/create-scout-dashboard-azure.sh
```

This single command will:
- ✅ Clone and convert Cruip Tailwind template
- ✅ Set up Next.js 15 with TypeScript
- ✅ Configure Azure PostgreSQL integration
- ✅ Create comprehensive dashboard components
- ✅ Set up CI/CD pipeline
- ✅ Generate documentation
- ✅ Initialize Git repository

---

## 📦 What You Get

### 🎯 Complete Project Structure
```
scout-dashboard-v4-azure/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (KPI, trends, products)
│   ├── dashboard/         # Main dashboard page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind styles
├── lib/                   # Utilities
│   └── db.ts             # Prisma database connection
├── prisma/               # Database schema & seeding
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Sample data seeding
├── .github/              # CI/CD workflows
│   └── workflows/ci.yml  # GitHub Actions pipeline
├── docs/                 # Documentation
└── README.md             # Setup guide
```

### 🔧 Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Azure PostgreSQL Flexible Server
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel with automated CI/CD
- **Testing**: ESLint, TypeScript, Visual testing ready

### 📊 Dashboard Features
- **Real-time KPIs**: Revenue, Orders, Average Order Value
- **Interactive Charts**: Revenue trends, product performance
- **Live Data**: 30-second refresh intervals
- **Responsive Design**: Mobile-first approach
- **AI Status**: Connection status indicators

---

## 🛠️ Setup Instructions

### Prerequisites
```bash
# Required tools
- Node.js 20+
- Git
- Azure PostgreSQL Flexible Server
- Vercel account (for deployment)
```

### Step 1: Run Automation
```bash
# Make script executable (if not already)
chmod +x scripts/create-scout-dashboard-azure.sh

# Run the automation
./scripts/create-scout-dashboard-azure.sh
```

### Step 2: Configure Database
```bash
# Navigate to project
cd scout-dashboard-v4-azure

# Update .env.local with your Azure PostgreSQL connection
# Replace the placeholder with your actual connection string
DATABASE_URL="postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require"
```

### Step 3: Install & Setup
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed

# Start development server
npm run dev
```

### Step 4: Open Dashboard
```bash
# Open in browser
open http://localhost:3000
```

---

## 🚀 Deployment

### Automatic Deployment (Recommended)
1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/scout-dashboard-v4-azure.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Import project from GitHub
   - Add `DATABASE_URL` environment variable
   - Deploy automatically

3. **CI/CD Pipeline**:
   - Automatic testing on pull requests
   - Preview deployments for branches
   - Production deployment on main branch

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 API Endpoints

### Available APIs
```bash
GET /api/kpi          # Dashboard KPIs
GET /api/trends       # Transaction trends
GET /api/products     # Product analytics
GET /api/consumers    # Consumer insights (ready for implementation)
```

### Example API Response
```json
{
  "revenue": 1250000,
  "orders": 2847,
  "aov": 439.12,
  "timestamp": "2025-06-18T06:18:00Z"
}
```

---

## 🗄️ Database Schema

### Core Tables
```sql
-- Transactions table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  barangay VARCHAR(100),
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(200),
  units INTEGER,
  peso_value DECIMAL(12,2)
);

-- Consumers table
CREATE TABLE consumers (
  id BIGSERIAL PRIMARY KEY,
  age_group VARCHAR(20),
  gender VARCHAR(10),
  region VARCHAR(50),
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product mix table
CREATE TABLE product_mix (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(200),
  combo_with VARCHAR(200),
  substitution VARCHAR(200),
  frequency INTEGER DEFAULT 0,
  revenue_impact DECIMAL(12,2)
);
```

### Sample Data
The automation includes sample data seeding:
- 5 sample transactions across different categories
- 3 consumer profiles with preferences
- 2 product mix combinations

---

## 🔧 Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio

# Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking
```

### Useful Scripts
```bash
# View database in browser
npm run db:studio

# Check TypeScript errors
npm run type-check

# Build and test production
npm run build && npm start
```

---

## 🎨 Customization

### Branding
```typescript
// tailwind.config.js - Update colors
theme: {
  extend: {
    colors: {
      'scout-blue': '#3B82F6',    // Primary blue
      'scout-green': '#10B981',   // Success green
      'scout-purple': '#8B5CF6',  // Accent purple
    }
  }
}
```

### Dashboard Layout
```typescript
// app/dashboard/page.tsx - Modify components
const { data: kpiData } = useSWR('/api/kpi', fetcher, { 
  refreshInterval: 30000  // Adjust refresh rate
})
```

### API Endpoints
```typescript
// Add new API route: app/api/custom/route.ts
export async function GET() {
  // Your custom logic
  return NextResponse.json(data)
}
```

---

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Visual testing (when configured)
npm run test:visual
```

### Manual Testing Checklist
- [ ] Dashboard loads correctly
- [ ] KPI cards display data
- [ ] Charts render properly
- [ ] Mobile responsiveness
- [ ] API endpoints respond
- [ ] Database connection works

---

## 🔒 Security

### Environment Variables
```bash
# Required environment variables
DATABASE_URL=postgresql://...     # Azure PostgreSQL connection
NEXTAUTH_SECRET=your-secret       # Authentication secret
NEXTAUTH_URL=http://localhost:3000 # Application URL
```

### Security Features
- ✅ SSL-encrypted database connections
- ✅ Environment variable encryption
- ✅ Input validation on API routes
- ✅ Rate limiting ready
- ✅ CORS configuration

---

## 📈 Performance

### Optimization Features
- **SWR Caching**: Client-side data caching
- **Next.js Optimization**: Automatic code splitting
- **Image Optimization**: Next.js image component
- **Bundle Analysis**: Built-in bundle analyzer

### Performance Targets
- **Page Load**: <2 seconds
- **API Response**: <150ms p95
- **Lighthouse Score**: ≥90
- **Core Web Vitals**: Optimized

---

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check connection string format
DATABASE_URL="postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require"

# Test connection
npx prisma db pull
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Check types
npm run type-check
```

### Getting Help
1. **Check Documentation**: Review README.md and API docs
2. **GitHub Issues**: Create issue with error details
3. **Logs**: Check browser console and server logs
4. **Community**: Search existing solutions

---

## 📚 Documentation

### Available Documentation
- [x] **README.md**: Setup and development guide
- [x] **PRD**: Product requirements document
- [x] **End State YAML**: Complete project specification
- [x] **Usage Guide**: This document
- [ ] **API Documentation**: Detailed endpoint specs
- [ ] **User Manual**: Dashboard usage guide

### Documentation Structure
```
docs/
├── Scout_Dashboard_v4_Azure_PRD.md           # Product requirements
├── scout_dashboard_v4_azure_end_state.yaml   # Project specification
├── AUTOMATION_USAGE_GUIDE.md                 # This guide
└── README.md                                  # Basic setup
```

---

## 🎉 Success Checklist

### Deployment Success
- [ ] Script runs without errors
- [ ] Database connection established
- [ ] Dashboard loads at http://localhost:3000
- [ ] KPI cards show data
- [ ] Charts render correctly
- [ ] API endpoints respond
- [ ] Mobile view works
- [ ] Production build succeeds

### Production Ready
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Sample data seeded
- [ ] CI/CD pipeline working
- [ ] Vercel deployment successful
- [ ] Performance targets met
- [ ] Security checklist completed

---

## 🔄 Next Steps

### Immediate Actions
1. **Run the automation script**
2. **Configure your Azure PostgreSQL connection**
3. **Test the dashboard locally**
4. **Deploy to production**

### Future Enhancements
- **AI Integration**: Add GPT-4 recommendations
- **Advanced Analytics**: More chart types
- **Real-time Updates**: WebSocket integration
- **Multi-tenant**: Support multiple clients
- **Mobile App**: React Native version

---

## 📞 Support

### Resources
- **GitHub Repository**: Source code and issues
- **Documentation**: Comprehensive guides
- **Community**: Developer discussions
- **Professional Support**: Enterprise options

### Contact
- **Issues**: GitHub issue tracker
- **Questions**: Discussion forums
- **Enterprise**: Professional support channels

---

**🎯 You now have everything needed to create a production-ready Scout Retail Dashboard with Azure PostgreSQL in minutes, not days!**

---

*Last Updated: June 18, 2025*  
*Version: 1.0*
