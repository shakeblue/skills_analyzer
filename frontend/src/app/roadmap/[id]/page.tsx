"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Target,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Video,
  FileCode,
  Dumbbell,
  ExternalLink,
  CalendarDays,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import { useRoadmap, useAnalysis, useMember, useProject } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { SkillTag } from "@/components/ui/skill-tag";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { RoadmapItem, LearningResource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOURS_PER_WEEK = 10;

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    dotClass: "bg-red-500",
    chartColor: "#ef4444",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
    chartColor: "#f59e0b",
  },
  low: {
    label: "Low",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
    chartColor: "#3b82f6",
  },
} as const;

const RESOURCE_TYPE_CONFIG: Record<
  LearningResource["type"],
  { icon: React.ElementType; label: string; badgeClass: string }
> = {
  documentation: {
    icon: BookOpen,
    label: "Documentation",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  course: {
    icon: GraduationCap,
    label: "Course",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
  video: {
    icon: Video,
    label: "Video",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
  tutorial: {
    icon: FileCode,
    label: "Tutorial",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  practice: {
    icon: Dumbbell,
    label: "Practice",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: RoadmapItem["priority"] }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge
      className={cn("border text-xs font-semibold", config.badgeClass)}
      aria-label={`${config.label} priority`}
    >
      {config.label}
    </Badge>
  );
}

function LevelProgression({
  current,
  target,
  skillName,
}: {
  current: number;
  target: number;
  skillName: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <SkillTag name={`Lvl ${current}`} level={current} variant="outline" />
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <SkillTag name={`Lvl ${target}`} level={target} />
      <span className="sr-only">
        {skillName}: from level {current} to level {target}
      </span>
    </div>
  );
}

function ResourceRow({ resource }: { resource: LearningResource }) {
  const config = RESOURCE_TYPE_CONFIG[resource.type];
  const IconComponent = config.icon;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground group-hover:text-primary">
            {resource.title}
          </span>
          <ExternalLink
            className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge
            className={cn(
              "border text-[10px] font-medium",
              config.badgeClass,
            )}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {resource.estimated_hours}h
          </span>
        </div>
      </div>
    </a>
  );
}

function RoadmapItemCard({
  item,
  index,
  isLast,
}: {
  item: RoadmapItem;
  index: number;
  isLast: boolean;
}) {
  const config = PRIORITY_CONFIG[item.priority];

  return (
    <div className="relative flex gap-4">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white shadow-sm",
            config.dotClass,
          )}
          aria-hidden="true"
        >
          {index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border" aria-hidden="true" />
        )}
      </div>

      {/* Card content */}
      <Card className="mb-6 flex-1">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{item.skill}</CardTitle>
            <PriorityBadge priority={item.priority} />
          </div>
          <CardDescription className="flex items-center gap-4 pt-1">
            <LevelProgression
              current={item.current_level}
              target={item.target_level}
              skillName={item.skill}
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Estimated: {item.estimated_hours} hours</span>
          </div>

          {item.resources.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Learning Resources
                </h4>
                <div className="grid gap-2">
                  {item.resources.map((resource, rIdx) => (
                    <ResourceRow key={rIdx} resource={resource} />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PriorityBreakdownChart({
  items,
}: {
  items: RoadmapItem[];
}) {
  const priorityData = (["high", "medium", "low"] as const)
    .map((priority) => {
      const filtered = items.filter((item) => item.priority === priority);
      const hours = filtered.reduce((sum, item) => sum + item.estimated_hours, 0);
      return {
        name: PRIORITY_CONFIG[priority].label,
        value: hours,
        color: PRIORITY_CONFIG[priority].chartColor,
      };
    })
    .filter((d) => d.value > 0);

  if (priorityData.length === 0) return null;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={priorityData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name}: ${value}h`}
            labelLine={false}
          >
            {priorityData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [`${value ?? 0} hours`, "Time"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RoadmapSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <Skeleton className="h-[200px] flex-1 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function RoadmapDetailPage() {
  const params = useParams();
  const analysisId = params.id as string;

  // Fetch roadmap data
  const {
    data: roadmap,
    isLoading: roadmapLoading,
    error: roadmapError,
  } = useRoadmap(analysisId);

  // Fetch analysis to get member_id and project_id
  const { data: analysis, isLoading: analysisLoading } =
    useAnalysis(analysisId);

  // Fetch member and project names (enabled only once analysis is loaded)
  const { data: member, isLoading: memberLoading } = useMember(
    analysis?.member_id ?? "",
    { enabled: !!analysis?.member_id },
  );

  const { data: project, isLoading: projectLoading } = useProject(
    analysis?.project_id ?? "",
    { enabled: !!analysis?.project_id },
  );

  const isLoading =
    roadmapLoading || analysisLoading || memberLoading || projectLoading;

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (roadmapError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold text-foreground">
            Failed to load roadmap
          </p>
          <p className="text-sm text-muted-foreground">
            {roadmapError.message}
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <RoadmapSkeleton />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!roadmap || roadmap.items.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
          <Target className="h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">
            No skills to improve
          </p>
          <p className="text-sm text-muted-foreground">
            This team member already meets all project requirements.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const items = roadmap.items;

  // Sort items: high first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  const sortedItems = [...items].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  const highCount = items.filter((i) => i.priority === "high").length;
  const mediumCount = items.filter((i) => i.priority === "medium").length;
  const lowCount = items.filter((i) => i.priority === "low").length;

  const estimatedWeeks = Math.ceil(roadmap.total_hours / HOURS_PER_WEEK);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Upskilling Roadmap
        </h1>
        <p className="mt-1 text-muted-foreground">
          {member?.name ?? "Team Member"}
          {" "}
          <span className="text-muted-foreground/60">for</span>
          {" "}
          {project?.name ?? "Project"}
        </p>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Hours"
          value={`${roadmap.total_hours}h`}
          icon={Clock}
        />
        <StatCard
          label="Skills to Improve"
          value={items.length}
          icon={Target}
        />
        <StatCard
          label="Estimated Weeks"
          value={`${estimatedWeeks}w`}
          trendLabel={`at ${HOURS_PER_WEEK}h/week`}
          trend="neutral"
          icon={CalendarDays}
        />
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <span className="text-sm font-medium text-muted-foreground">
              Priority Breakdown
            </span>
            <div className="mt-2 flex items-center gap-3">
              {highCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-foreground">
                    {highCount}
                  </span>
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-foreground">
                    {mediumCount}
                  </span>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-foreground">
                    {lowCount}
                  </span>
                  <span className="text-xs text-muted-foreground">Low</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning path timeline */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            Learning Path
          </h2>
        </div>

        <div className="pl-1">
          {sortedItems.map((item, idx) => (
            <RoadmapItemCard
              key={`${item.skill}-${idx}`}
              item={item}
              index={idx}
              isLast={idx === sortedItems.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Time estimation summary */}
      <section>
        <Separator className="mb-8" />
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Time Estimation Summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Breakdown of estimated learning time by priority level
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Summary stats */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Learning Time
                </span>
                <span className="text-lg font-bold text-foreground">
                  {roadmap.total_hours} hours
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated Duration
                </span>
                <span className="text-lg font-bold text-foreground">
                  {estimatedWeeks} week{estimatedWeeks !== 1 ? "s" : ""}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Weekly Commitment
                </span>
                <span className="text-lg font-bold text-foreground">
                  {HOURS_PER_WEEK} hours/week
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Hours by Priority
                </span>
                {(["high", "medium", "low"] as const).map((priority) => {
                  const hours = items
                    .filter((i) => i.priority === priority)
                    .reduce((sum, i) => sum + i.estimated_hours, 0);
                  if (hours === 0) return null;
                  const config = PRIORITY_CONFIG[priority];
                  return (
                    <div
                      key={priority}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            config.dotClass,
                          )}
                        />
                        <span className="text-sm text-foreground">
                          {config.label} Priority
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {hours}h
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Time Distribution
              </CardTitle>
              <CardDescription>
                Learning hours allocated by priority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriorityBreakdownChart items={items} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
