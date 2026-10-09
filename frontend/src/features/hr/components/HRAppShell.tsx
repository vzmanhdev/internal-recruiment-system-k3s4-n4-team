'use client';

import React from 'react';
import { HRHeader } from './HRHeader';
import { HRSidebar } from './HRSidebar';

interface HRAppShellProps {
  children: React.ReactNode;
}

export const HRAppShell: React.FC<HRAppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Shared Global Top Header (100% w-full, z-50, bg-white, border-b border-slate-200) */}
      <HRHeader />

      {/* Main Body with Floating Sidebar & Content */}
      <div className="flex-1 w-full flex">
        {/* Floating Sidebar (ml-6 mt-6 w-64 bg-white rounded-2xl shadow-sm border border-slate-100) */}
        <HRSidebar />

        {/* Main Content Area (flex-1 m-6 overflow-y-auto) */}
        <main className="flex-1 m-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

