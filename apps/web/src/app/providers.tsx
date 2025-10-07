'use client';

import { ReactNode, useEffect } from 'react';
import { setUserContext } from '@/lib/monitoring/sentry';
import { usePageView } from '@/lib/monitoring/vercel-analytics';

export function Providers({ children }: { children: ReactNode }) {
  // Track page views
  usePageView();
  
  // Set user context for error tracking
  useEffect(() => {
    // In a real app, get this from your auth context
    const user = {
      id: 'anonymous',
      // email: session?.user?.email,
      // username: session?.user?.name,
    };
    
    setUserContext(user);
  }, []);
  
  return <>{children}</>;
}