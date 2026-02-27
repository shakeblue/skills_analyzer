import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// StatCard -- displays a single stat with label, value, and optional trend
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional trend direction */
  trend?: "up" | "down" | "neutral";
  /** Optional trend description e.g. "+12% from last month" */
  trendLabel?: string;
  /** Optional icon rendered to the left of the value */
  icon?: React.ElementType;
  className?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, color: "text-emerald-600" },
  down: { icon: TrendingDown, color: "text-red-600" },
  neutral: { icon: Minus, color: "text-slate-400" },
} as const;

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: IconProp,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : "";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </span>
          </div>
          {IconProp && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <IconProp className="h-5 w-5" />
            </div>
          )}
        </div>

        {trend && (
          <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trendColor)}>
            {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
