"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  GitCompareArrows,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Members", href: "/members", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Analysis", href: "/analysis", icon: BarChart3 },
  { label: "Compare", href: "/compare", icon: GitCompareArrows },
  { label: "Roadmap", href: "/roadmap", icon: GraduationCap },
];

// ---------------------------------------------------------------------------
// Sidebar navigation content (shared between desktop & mobile)
// ---------------------------------------------------------------------------

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        const linkContent = (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-blue-50 hover:text-blue-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600",
              collapsed && "justify-center px-2"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={cn("h-5 w-5 shrink-0", active && "text-blue-600")} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30",
          "border-r border-slate-200 bg-slate-50 transition-[width] duration-200 ease-in-out",
          collapsed ? "md:w-[68px]" : "md:w-60"
        )}
      >
        {/* Logo / brand area */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-slate-200 px-3",
            collapsed ? "justify-center" : "gap-2"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            SA
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-slate-900 truncate">
              Skills Analyzer
            </span>
          )}
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <div className="flex border-t border-slate-200 p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-9 w-9 text-slate-500 hover:text-slate-700", !collapsed && "ml-auto")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Mobile sidebar (Sheet-based drawer)
// ---------------------------------------------------------------------------

export interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-slate-50 p-0">
        <SheetHeader className="border-b border-slate-200 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              SA
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Skills Analyzer
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <SidebarNav collapsed={false} onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
