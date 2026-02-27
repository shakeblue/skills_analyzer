"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitCompare,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

import { useAnalysis, useMember, useProject } from "@/lib/api";
import { useAppStore } from "@/stores/app-store";
import type { SkillGap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGapStatusColor(status: SkillGap["gap_status"]) {
  switch (status) {
    case "fully_met":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
        label: "Fully Met",
      };
    case "partially_met":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        badge: "border-amber-200 bg-amber-100 text-amber-700",
        label: "Partially Met",
      };
    case "not_met":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        badge: "border-red-200 bg-red-100 text-red-700",
        label: "Not Met",
      };
  }
}

function getBarColor(score: number) {
  if (score >= 80) return "hsl(152, 60%, 45%)";
  if (score >= 60) return "hsl(38, 80%, 55%)";
  if (score >= 40) return "hsl(25, 80%, 55%)";
  return "hsl(0, 70%, 55%)";
}

// ---------------------------------------------------------------------------
// Overall Score Ring
// ---------------------------------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const data = [{ name: "Score", value: clamped, fill: getBarColor(clamped) }];

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={data}
            barSize={14}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: "hsl(var(--muted))" }}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{clamped}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        Overall Fit Score
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Bar Chart
// ---------------------------------------------------------------------------

interface CategoryChartProps {
  data: { category: string; score: number; weight: number }[];
}

function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 52)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="category"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            `${Math.round(value ?? 0)} / 100`,
            "Score",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Analysis Result Page
// ---------------------------------------------------------------------------

export default function AnalysisResultPage() {
  const params = useParams();
  const analysisId = params.id as string;

  const addRecentAnalysis = useAppStore((s) => s.addRecentAnalysis);

  const {
    data: analysis,
    isLoading: analysisLoading,
    isError: analysisError,
    error: analysisErrorObj,
  } = useAnalysis(analysisId);

  const { data: member, isLoading: memberLoading } = useMember(
    analysis?.member_id ?? "",
    { enabled: !!analysis?.member_id },
  );

  const { data: project, isLoading: projectLoading } = useProject(
    analysis?.project_id ?? "",
    { enabled: !!analysis?.project_id },
  );

  // Track in recent analyses
  useEffect(() => {
    if (analysisId) {
      addRecentAnalysis(analysisId);
    }
  }, [analysisId, addRecentAnalysis]);

  const isLoading = analysisLoading || memberLoading || projectLoading;

  // Sort gaps: not_met first, then partially_met, then fully_met
  const sortedGaps = useMemo(() => {
    if (!analysis?.gaps) return [];
    const order: Record<string, number> = {
      not_met: 0,
      partially_met: 1,
      fully_met: 2,
    };
    return [...analysis.gaps].sort(
      (a, b) => (order[a.gap_status] ?? 3) - (order[b.gap_status] ?? 3),
    );
  }, [analysis?.gaps]);

  // Category chart data
  const chartData = useMemo(
    () =>
      analysis?.category_scores.map((cs) => ({
        category: cs.category,
        score: Math.round(cs.score),
        weight: cs.weight,
      })) ?? [],
    [analysis?.category_scores],
  );

  // Gap summary counts
  const gapSummary = useMemo(() => {
    if (!analysis?.gaps) return { met: 0, partial: 0, notMet: 0 };
    return {
      met: analysis.gaps.filter((g) => g.gap_status === "fully_met").length,
      partial: analysis.gaps.filter((g) => g.gap_status === "partially_met").length,
      notMet: analysis.gaps.filter((g) => g.gap_status === "not_met").length,
    };
  }, [analysis?.gaps]);

  // Error state
  if (analysisError) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/analysis">
            <ArrowLeft className="h-4 w-4" />
            Back to Analysis
          </Link>
        </Button>
        <Card className="max-w-lg border-destructive/50">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-4 text-lg font-medium">Failed to load analysis</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysisErrorObj?.message ?? "An unexpected error occurred."}
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/analysis">Run a New Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/analysis">
            <ArrowLeft className="h-4 w-4" />
            Back to Analysis
          </Link>
        </Button>

        {/* Page header */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-96" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Analysis: {member?.name ?? "Member"} vs{" "}
              {project?.name ?? "Project"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Skill fit analysis performed on{" "}
              {analysis?.created_at
                ? new Date(analysis.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "an unknown date"}
            </p>
          </div>
        )}
      </div>

      {/* Overall Score & Actions */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="col-span-2 h-72 rounded-xl" />
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Score ring card */}
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ScoreRing score={analysis.overall_score} />

              {/* Gap summary badges */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                  {gapSummary.met} fully met
                </Badge>
                <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                  {gapSummary.partial} partial
                </Badge>
                <Badge className="border-red-200 bg-red-100 text-red-700">
                  {gapSummary.notMet} gaps
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Category scores chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category Scores</CardTitle>
              <CardDescription>
                Score breakdown per skill category (out of 100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryChart data={chartData} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Action buttons */}
      {analysis && (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/roadmap?analysis=${analysis.id}`}>
              <GraduationCap className="h-4 w-4" />
              Generate Roadmap
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/compare?project=${analysis.project_id}`}>
              <GitCompare className="h-4 w-4" />
              Compare with Others
            </Link>
          </Button>
        </div>
      )}

      {/* Gap Classification Table */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : analysis && sortedGaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Classification</CardTitle>
            <CardDescription>
              Detailed breakdown of each required skill and its current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Required Level</TableHead>
                  <TableHead className="text-center">Current Level</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedGaps.map((gap) => {
                  const status = getGapStatusColor(gap.gap_status);
                  return (
                    <TableRow key={`${gap.category}-${gap.skill}`} className={cn(status.bg)}>
                      <TableCell className="font-medium">{gap.skill}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {gap.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="tabular-nums font-medium">
                          {gap.required_level}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="tabular-nums font-medium">
                          {gap.current_level}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            status.badge,
                          )}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
