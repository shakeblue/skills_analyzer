"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Route label mapping for breadcrumbs
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/members": "Members",
  "/projects": "Projects",
  "/analysis": "Analysis",
  "/compare": "Compare",
  "/roadmap": "Roadmap",
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [];

  if (pathname === "/") {
    crumbs.push({ label: "Dashboard", href: "/" });
    return crumbs;
  }

  // Build cumulative path segments
  const segments = pathname.split("/").filter(Boolean);
  let accumulated = "";

  for (const segment of segments) {
    accumulated += `/${segment}`;
    const label = ROUTE_LABELS[accumulated] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------

export interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 md:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9 text-slate-600"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* App title -- visible on mobile only to reinforce branding */}
      <span className="text-sm font-semibold text-slate-900 md:hidden">
        Skills Analyzer
      </span>

      {/* Breadcrumbs -- desktop */}
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <span className="text-slate-500">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />
    </header>
  );
}
