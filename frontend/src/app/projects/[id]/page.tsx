"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProject } from "@/lib/api";
import type { SkillCategory, SkillRequirement } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillTag } from "@/components/ui/skill-tag";
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Layers,
  Wrench,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIE_COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
];

const importanceStyles: Record<
  SkillRequirement["importance"],
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },
  important: {
    label: "Important",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },
  nice_to_have: {
    label: "Nice to have",
    className:
      "border-slate-200 bg-slate-50 text-slate-600",
  },
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mx-auto h-52 w-52 rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category card
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  colorIndex,
}: {
  category: SkillCategory;
  colorIndex: number;
}) {
  const weightPercent = Math.round(category.weight * 100);
  const color = PIE_COLORS[colorIndex % PIE_COLORS.length];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{category.name}</CardTitle>
          <span
            className="text-sm font-semibold"
            style={{ color }}
          >
            {weightPercent}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight bar */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">
            Category weight
          </span>
          <Progress
            value={weightPercent}
            className="h-2"
            aria-label={`${category.name} weight: ${weightPercent}%`}
          />
        </div>

        {/* Skills list */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Required skills ({category.skills.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {category.skills.map((skill) => {
              const imp = importanceStyles[skill.importance];
              return (
                <div key={skill.name} className="flex items-center gap-1.5">
                  <SkillTag
                    name={skill.name}
                    level={skill.required_level}
                    variant="outline"
                  />
                  <Badge
                    variant="outline"
                    className={imp.className}
                  >
                    {imp.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { data: project, isLoading, isError, error } = useProject(projectId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Failed to load project.{" "}
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const totalSkills = project.categories.reduce(
    (sum, cat) => sum + cat.skills.length,
    0,
  );

  const pieData = project.categories.map((cat, i) => ({
    name: cat.name,
    value: Math.round(cat.weight * 100),
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/projects">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>

      {/* Project header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {project.name}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {project.platform}
          </Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          {project.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            {project.categories.length}{" "}
            {project.categories.length === 1 ? "category" : "categories"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wrench className="h-4 w-4" />
            {totalSkills} {totalSkills === 1 ? "skill" : "skills"} total
          </span>
        </div>
      </div>

      {/* Main content: categories + pie chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Skill categories */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <BarChart3 className="h-5 w-5" />
            Skill Categories
          </h2>
          {project.categories.map((category, i) => (
            <CategoryCard
              key={category.name}
              category={category}
              colorIndex={i}
            />
          ))}
        </div>

        {/* Pie chart sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Weight Distribution
          </h2>
          <Card>
            <CardContent className="pt-6">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ name, value }) => `${value}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0}%`, "Weight"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No categories defined.
                </p>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <Button className="w-full" size="lg" asChild>
            <Link href={`/analysis?project=${project.id}`}>
              Run Analysis Against This Project
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
