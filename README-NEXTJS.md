# Scout Dashboard - Next.js 15 + Supabase

A modern, real-time analytics dashboard for retail transaction data built with Next.js 15, Supabase, and TypeScript. Features a complete Philippines choropleth map and comprehensive analytics panels.

## 🚀 Features

- **🗺️ Philippines Choropleth Map**: Interactive map showing transaction density and sales by province
- **📊 Real-time Analytics**: Live dashboard with transaction trends and insights
- **🎯 Consumer Behavior Analysis**: Request types, acceptance rates, and behavioral patterns
- **👥 Customer Profiling**: Demographic analysis with spending patterns
- **📈 Product Mix Analysis**: Category and brand performance with Pareto analysis
- **⚡ Performance Optimized**: Built with Next.js 15, TypeScript, and efficient data fetching
- **🎨 Modern UI**: Beautiful interface with shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Row Level Security)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts for data visualization
- **Maps**: react-svg-map with @svg-maps/philippines
- **Data Processing**: d3-scale, d3-array, d3-format
- **State Management**: SWR for server state

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project
- Git

## 🏗️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd scout-dashboard
pnpm install
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database schema**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL to create tables, views, and policies

3. **Get your Supabase credentials**:
   - Go to Settings > API
   - Copy your Project URL and anon public key
   - Copy your service role key (for data import)

### 3. Environment Variables

Create `.env.local` and update with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Import Sample Data

1. **Create data directory**:
```bash
mkdir data
```

2. **Add your JSON files**:
   - Place your Query JSON files (Query1.json, Query2.json, etc.) in the `data/` directory
   - Files should contain transaction records with fields like:
     - InteractionID, StoreID, TransactionDate
     - Region, Province, City, Barangay  
     - Category, Brand, SKU, Amount
     - Gender, Age

3. **Run the import script**:
```bash
pnpm run import-data
```

The script will:
- Transform your data to match the Scout schema
- Generate realistic additional fields (request types, behavior data)
- Insert data in batches for optimal performance
- Provide detailed import progress and verification

### 5. Start Development Server

```bash
pnpm run dev
```

Visit http://localhost:3000 to see your dashboard!

## 📊 Dashboard Sections

### 1. **Transaction Overview**
- Total transactions, sales, and average transaction values
- Daily transaction volume and sales trends
- Key performance indicators

### 2. **Geographic Distribution**  
- Interactive Philippines choropleth map
- Province-level transaction density and sales heat maps
- Toggle between transaction count and sales value views

### 3. **Product Mix Analysis**
- Product category distribution (pie chart and bar chart)
- Brand performance analysis
- Pareto analysis (80/20 rule) for brand optimization
- Top categories and brands by volume and sales

### 4. **Consumer Behavior**
- Request type distribution (verbal, pointing, indirect)
- Acceptance rates by request style
- Behavioral pattern insights

### 5. **Consumer Profiling**
- Demographic analysis by gender and age brackets
- Average spending patterns by segment
- Customer volume vs spending scatter analysis
- High-value segment identification

### 6. **AI Insights & Recommendations**
- Market focus recommendations
- Growth opportunities
- Timing strategies

## 🗂️ Project Structure

```
scout-dashboard/
├── app/                          # Next.js 15 app router
│   ├── api/scout/               # API routes for data fetching
│   │   ├── trends/route.ts      # Transaction trends endpoint
│   │   ├── geo/route.ts         # Geographic data endpoint
│   │   ├── product-mix/route.ts # Product analysis endpoint
│   │   ├── behavior/route.ts    # Consumer behavior endpoint
│   │   └── profiling/route.ts   # Customer profiling endpoint
│   ├── globals.css              # Global styles and theme
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard page
├── components/
│   ├── scout/                   # Dashboard-specific components
│   │   ├── geo-choropleth.tsx   # Philippines map component
│   │   ├── trends-panel.tsx     # Transaction trends panel
│   │   ├── product-mix-panel.tsx # Product analysis panel
│   │   ├── behavior-panel.tsx   # Consumer behavior panel
│   │   └── profiling-panel.tsx  # Customer profiling panel
│   └── ui/                      # Reusable UI components (shadcn/ui)
├── lib/
│   ├── supabase/               # Supabase client configuration
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   ├── types/                  # TypeScript type definitions
│   └── utils.ts                # Utility functions
├── scripts/
│   └── import-data.ts          # Data import script
├── supabase/
│   └── schema.sql              # Database schema and views
└── data/                       # JSON data files (create manually)
```

## 🎨 Customization

### Adding New Charts
1. Create component in `components/scout/`
2. Add API route in `app/api/scout/`
3. Create Supabase view if needed
4. Import and use in main page

### Modifying the Map
- The choropleth uses `@svg-maps/philippines` for accurate province boundaries
- Province name mapping is handled in `lib/utils.ts` 
- Color scales and styling can be customized in the component

### Database Views
All analytics are powered by Supabase views that leverage production dimensional tables:
- `v_trends_daily` - Daily transaction trends
- `v_geo_province` - Geographic distribution using `ph_provinces` table for accurate province mapping
- `v_product_mix` - Product and brand analysis with `master_categories` and `master_brands` integration
- `v_behavior` - Consumer behavior patterns
- `v_profiling` - Customer demographic analysis
- `v_competitive_analysis` - Brand performance with TBWA client classification and tier data

The views automatically join with master data tables (`master_brands`, `master_categories`) and Philippine geographic data (`ph_provinces`) from the production deployment for enhanced data quality and consistency.

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial Scout Dashboard setup"
git push origin main
```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Configure Supabase**:
   - Add your Vercel domain to Supabase Auth settings
   - Update CORS settings if needed

### Other Platforms

The app works on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run type-check` - Run TypeScript compiler
- `pnpm run import-data` - Import data from JSON files

## 🐛 Troubleshooting

### Common Issues

1. **Map not rendering**: 
   - Check that `@svg-maps/philippines` is installed
   - Verify CSS imports in globals.css

2. **Data not loading**:
   - Check Supabase connection and credentials
   - Verify database schema was created correctly
   - Check browser network tab for API errors

3. **Import script failing**:
   - Ensure JSON files are in `data/` directory
   - Check file format matches expected structure
   - Verify Supabase service role key permissions

### Performance Tips

- Enable Supabase connection pooling for production
- Consider implementing caching for frequently accessed data
- Use Next.js Image optimization for better performance
- Monitor Supabase usage and optimize queries as needed

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

- Built with [Next.js 15](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Philippines map data from [@svg-maps/philippines](https://github.com/VictorCazanave/svg-maps)
- Charts powered by [Recharts](https://recharts.org/)

---

**Ready to explore your retail data!** 🎉

For questions or support, please create an issue in the repository.