import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '../../lib/utils';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isInbox = location.pathname.startsWith('/inbox');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className={cn('flex-1 w-full mx-auto', isInbox ? 'p-0 sm:p-4 lg:p-6 max-w-full' : 'p-4 lg:p-8 max-w-7xl')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
