'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import type { PlanType } from '@/lib/types';

interface DashboardShellProps {
  children: React.ReactNode;
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
  spinsUsed: number;
  spinsLimit: number;
}

export function DashboardShell({
  children,
  businessName,
  businessLogoUrl,
  planType,
  spinsUsed,
  spinsLimit,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
        planType={planType}
        spinsUsed={spinsUsed}
        spinsLimit={spinsLimit}
        mobileOpen={mobileMenuOpen}
        onMobileClose={closeMenu}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Mobile topbar */}
        <Topbar onMenuToggle={toggleMenu} />

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
