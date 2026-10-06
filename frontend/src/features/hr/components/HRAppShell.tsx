'use client';

import React from 'react';
import { HRHeader } from './HRHeader';
import { HRSidebar } from './HRSidebar';

interface HRAppShellProps {
  children: React.ReactNode;
}

export const HRAppShell: React.FC<HRAppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Shared Global HR Header */}
      <HRHeader />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 w-full max-w-full flex">
        {/* 5-Group White Sidebar */}
        <HRSidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
