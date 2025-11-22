'use client';

import dynamic from 'next/dynamic';
import { MobileSidebarToggle } from './mobile-sidebar-toggle';

const Sidebar = dynamic(() => import('./sidebar'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4 p-4">
      {/* Categories skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
});

// Desktop sidebar component - used inside homepage-sidebar wrapper
export function DesktopSidebar() {
  return <Sidebar />;
}

// Mobile sidebar component - used outside homepage-sidebar wrapper
export function MobileSidebar() {
  return (
    <div className="block lg:hidden">
      <MobileSidebarToggle>
        <Sidebar />
      </MobileSidebarToggle>
    </div>
  );
}

// Default export - desktop sidebar only (for backward compatibility)
export default function LazySidebar() {
  return <DesktopSidebar />;
}