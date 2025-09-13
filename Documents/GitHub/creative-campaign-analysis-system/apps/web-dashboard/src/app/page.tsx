import { Suspense } from 'react';
import { SearchInterface } from '@/components/search/search-interface';
import { OverviewStats } from '@/components/dashboard/overview-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Creative Campaign Analysis"
        description="Discover insights from your creative campaigns using AI-powered semantic search"
      />

      {/* Search Interface */}
      <div className="grid gap-6">
        <Suspense fallback={<LoadingSpinner />}>
          <SearchInterface />
        </Suspense>
      </div>

      {/* Dashboard Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSpinner />}>
            <OverviewStats />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  );
}