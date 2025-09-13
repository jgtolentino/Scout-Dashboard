# TBWA Analytics Dashboard

A Power BI-style analytics dashboard for the TBWA HRIS, Expense Management, and Ticketing platform. Built with Next.js 14+, Tailwind CSS, and real-time Supabase integration.

![TBWA Dashboard](https://via.placeholder.com/1200x600/FFD700/000000?text=TBWA+Analytics+Dashboard)

## 🚀 Features

### Core Analytics
- **Real-time KPI Cards** - Live metrics for expenses, tickets, office attendance, and policy violations
- **Interactive Charts** - Expense categories pie chart, cash advance tracking, approval timelines
- **Role-Based Views** - Customized dashboards for employees, managers, and admins
- **Drill-Through Analysis** - Click any metric to see detailed breakdowns
- **AI-Powered Insights** - Integrated Maya, LearnBot, and YaYo agents for contextual help

### Technical Features
- **Mobile-First Responsive** - Works seamlessly on all devices
- **Dark Mode Support** - Automatic theme switching with system preference detection
- **WCAG 2.1 Compliant** - Full accessibility with keyboard navigation and screen reader support
- **Real-Time Updates** - Live data synchronization via Supabase subscriptions
- **Offline Support** - Progressive Web App with offline capabilities

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase project with configured schema
- Environment variables (see `.env.example`)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/tbwa/analytics-dashboard.git
cd apps/dashboard
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

4. **Run database migrations**
```bash
npm run db:migrate
```

## 🚀 Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npm run storybook` - Start Storybook for component development
- `npm run test` - Run tests

## 📁 Project Structure

```
apps/dashboard/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (dashboard)/    # Dashboard layout group
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── analytics/      # Chart components
│   │   ├── layout/         # Layout components
│   │   └── ui/            # UI primitives
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   └── types/             # TypeScript types
├── public/                # Static assets
├── .env.example          # Environment template
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind CSS config
└── tsconfig.json         # TypeScript config
```

## 🎨 Design System

The dashboard uses TBWA's brand colors and design system:

- **Primary**: TBWA Yellow (#FFD700)
- **Secondary**: TBWA Black (#000000)
- **Typography**: Inter for UI, Fira Code for data
- **Spacing**: 8-point grid system
- **Components**: Consistent with TBWA brand guidelines

## 📊 Analytics Components

### KPI Cards
```tsx
import { ExpenseKPICard } from '@/components/analytics/KPICard'

<ExpenseKPICard 
  data={expenseData}
  onClick={handleDrilldown}
/>
```

### Charts
```tsx
import { ExpenseCategoryPie } from '@/components/analytics/ExpenseCategoryPie'

<ExpenseCategoryPie />
```

### Data Hooks
```tsx
import { useKpiMetrics } from '@/hooks/useKpiMetrics'

const { data, isLoading } = useKpiMetrics()
```

## 🔒 Security

- Row Level Security (RLS) via Supabase
- JWT authentication with refresh tokens
- CORS protection
- Input sanitization
- CSP headers configured

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**
```bash
vercel
```

2. **Configure environment variables** in Vercel dashboard

3. **Deploy**
```bash
vercel --prod
```

### Docker

```bash
docker build -t tbwa-dashboard .
docker run -p 3000:3000 tbwa-dashboard
```

### Traditional Hosting

```bash
npm run build
npm run start
```

## 📱 Mobile App

The dashboard is fully responsive and works as a Progressive Web App (PWA):

1. Open dashboard on mobile device
2. Click "Add to Home Screen"
3. Launch as standalone app

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Component tests in Storybook
npm run storybook
```

## 📈 Performance

- Lighthouse Score: 95+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle size: < 250KB gzipped

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary to TBWA. All rights reserved.

## 🆘 Support

- Documentation: [docs.tbwa.com/dashboard](https://docs.tbwa.com/dashboard)
- Issues: [GitHub Issues](https://github.com/tbwa/dashboard/issues)
- Email: support@tbwa.com

---

Built with ❤️ by TBWA Digital Team