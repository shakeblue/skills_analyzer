"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// AppShell -- combines sidebar + header + scrollable main content area
// ---------------------------------------------------------------------------

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile sidebar (Sheet) */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Main content area: offset by sidebar width */}
      <div
        className={cn(
          "flex flex-col transition-[margin-left] duration-200 ease-in-out",
          "md:ml-60",
          sidebarCollapsed && "md:ml-[68px]"
        )}
      >
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
