# Scout Platform v5.2 - Next.js Project Structure

## Directory Overview

```
scout-platform-v5/
├── README.md
├── next.config.js
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── KPICard.tsx
│   │   │   ├── TimeseriesChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   └── Choropleth.tsx
│   │   ├── dashboard/
│   │   │   └── ExecutiveDashboard.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── scoutFetch.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useScoutAPI.ts
│   │   └── useDashboard.ts
│   └── styles/
│       └── components.css
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── v5.2-MIGRATION.md
└── tests/
    ├── components/
    ├── pages/
    └── e2e/
```

## Key Files Created

### Configuration Files
- **package.json** - Dependencies and scripts for Next.js 14 with TypeScript
- **next.config.js** - Next.js configuration with redirects and headers
- **tailwind.config.js** - Tailwind CSS with Scout Platform design tokens
- **tsconfig.json** - TypeScript configuration with path aliases
- **postcss.config.js** - PostCSS configuration for Tailwind
- **.gitignore** - Git ignore patterns for Next.js projects
- **.env.example** - Environment variables template

### Core Application Files
- **src/app/layout.tsx** - Root layout with metadata and Inter font
- **src/app/page.tsx** - Homepage with API connection testing
- **src/app/globals.css** - Global CSS with Scout design system
- **src/app/dashboard/page.tsx** - Dashboard route handler

### Components
- **src/components/dashboard/ExecutiveDashboard.tsx** - Main dashboard with 8 charts
- **src/lib/scoutFetch.ts** - v5.2 API client with retry logic and error handling

### Documentation
- **docs/FRONTEND_SETUP.md** - Complete setup and deployment guide

## Architecture Decisions

### Next.js 14 with App Router
- Modern React Server Components
- File-based routing system
- Built-in TypeScript support
- Optimized bundle splitting

### Tailwind CSS Design System
- Scout Platform design tokens
- Responsive utility classes
- Custom component styles
- Dark mode support ready

### API Integration Strategy
- scoutFetch v5.2 utility class
- Retry logic with exponential backoff
- TypeScript interfaces for all responses
- Error boundary patterns

### Component Architecture
- Functional components with hooks
- Loading states for all data
- Error handling with user feedback
- Responsive grid layouts

## Getting Started Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run tests
npm test

# E2E tests
npm run e2e
```

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_APP_ENV` - Environment (development/production)
- `NEXT_PUBLIC_APP_VERSION` - Application version (5.2.0)

## API Integration

The scoutFetch utility provides access to all v5.2 API endpoints:

```typescript
// Gold Layer APIs
await scoutFetch.gold.campaign_effect_api();
await scoutFetch.gold.regional_performance_api();

// Platinum Layer APIs  
await scoutFetch.platinum.executive_dashboard_api();

// Deep Research APIs (new in v5.2)
await scoutFetch.deep_research.analyze_api({
  query_topic: 'campaign insights'
});
```

## Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `src/`
3. **Test Changes**: Visit `http://localhost:3000`
4. **Type Check**: `npm run type-check`
5. **Build**: `npm run build`
6. **Deploy**: Push to main branch (Vercel auto-deploy)

## Production Deployment

The project is configured for seamless Vercel deployment:
- Automatic builds on git push
- Environment variable management
- Edge function optimization
- CDN asset caching

Ready for immediate deployment with your Supabase v5.2 backend!