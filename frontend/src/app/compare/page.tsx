"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitCompare,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useMembers, useProjects, useCompare } from "@/lib/api";
import { useAppStore } from "@/stores/app-store";
import type { ComparisonResult, MemberRanking } from "@/lib/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** Generate a deterministic color palette for members in charts. */
const MEMBER_COLORS = [
  "hsl(215, 70%, 55%)",
  "hsl(152, 60%, 45%)",
  "hsl(38, 80%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(185, 60%, 42%)",
  "hsl(12, 75%, 55%)",
  "hsl(95, 55%, 42%)",
];

function getHeatmapColor(score: number): string {
  if (score >= 80) return "bg-emerald-200 text-emerald-900";
  if (score >= 60) return "bg-emerald-100 text-emerald-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  if (score >= 20) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Trophy className="h-4 w-4 text-amber-700" />;
  return <span className="text-sm text-muted-foreground">#{rank}</span>;
}

// ---------------------------------------------------------------------------
// Grouped Bar Chart for comparison
// ---------------------------------------------------------------------------

interface ComparisonChartProps {
  result: ComparisonResult;
}

function ComparisonChart({ result }: ComparisonChartProps) {
  // Collect all unique categories
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    for (const ranking of result.rankings) {
      for (const cs of ranking.category_scores) {
        catSet.add(cs.category);
      }
    }
    return Array.from(catSet);
  }, [result.rankings]);

  // Transform into chart data: one entry per category with each member as a field
  const chartData = useMemo(() => {
    return categories.map((cat) => {
      const entry: Record<string, string | number> = { category: cat };
      for (const ranking of result.rankings) {
        const cs = ranking.category_scores.find((c) => c.category === cat);
        entry[ranking.member_name] = cs ? Math.round(cs.score) : 0;
      }
      return entry;
    });
  }, [categories, result.rankings]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, categories.length * 60)}>
      <BarChart
        data={chartData}
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
          formatter={(value: number | undefined) => [`${value ?? 0} / 100`, ""]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
          }}
        />
        <Legend />
        {result.rankings.map((ranking, idx) => (
          <Bar
            key={ranking.member_id}
            dataKey={ranking.member_name}
            fill={MEMBER_COLORS[idx % MEMBER_COLORS.length]}
            radius={[0, 4, 4, 0]}
            barSize={16}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Heatmap Table
// ---------------------------------------------------------------------------

interface HeatmapProps {
  result: ComparisonResult;
}

function HeatmapTable({ result }: HeatmapProps) {
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    for (const ranking of result.rankings) {
      for (const cs of ranking.category_scores) {
        catSet.add(cs.category);
      }
    }
    return Array.from(catSet);
  }, [result.rankings]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">
              Member
            </TableHead>
            {categories.map((cat) => (
              <TableHead key={cat} className="text-center whitespace-nowrap">
                {cat}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rankings.map((ranking) => (
            <TableRow key={ranking.member_id}>
              <TableCell className="sticky left-0 bg-background font-medium whitespace-nowrap">
                {ranking.member_name}
              </TableCell>
              {categories.map((cat) => {
                const cs = ranking.category_scores.find(
                  (c) => c.category === cat,
                );
                const score = cs ? Math.round(cs.score) : 0;
                return (
                  <TableCell key={cat} className="text-center p-1">
                    <span
                      className={cn(
                        "inline-flex h-9 w-14 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                        getHeatmapColor(score),
                      )}
                    >
                      {score}
                    </span>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Page
// ---------------------------------------------------------------------------

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project") ?? "";

  // Zustand store for member selection
  const selectedMemberIds = useAppStore((s) => s.selectedMemberIds);
  const toggleMemberSelection = useAppStore((s) => s.toggleMemberSelection);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const [projectId, setProjectId] = useState(preselectedProject);

  // Sync project from URL
  useEffect(() => {
    if (preselectedProject) setProjectId(preselectedProject);
  }, [preselectedProject]);

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const compare = useCompare();

  const selectedProject = projects?.find((p) => p.id === projectId);
  const canCompare =
    projectId && selectedMemberIds.length >= 2 && !compare.isPending;

  function handleCompare() {
    if (!projectId || selectedMemberIds.length < 2) return;

    compare.mutate({
      member_ids: selectedMemberIds,
      project_id: projectId,
    });
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Compare Members
        </h1>
        <p className="mt-1 text-muted-foreground">
          Select a project and multiple team members to compare their skill fit
          side-by-side.
        </p>
      </div>

      {/* Selection controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Project</CardTitle>
            <CardDescription>
              Choose which project to evaluate against
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedProject && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {selectedProject.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Member multi-select */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Select Members</CardTitle>
                <CardDescription>
                  Pick at least 2 members to compare (
                  {selectedMemberIds.length} selected)
                </CardDescription>
              </div>
              {selectedMemberIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {members?.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMemberSelection(member.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-input bg-background",
                      )}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.role} - {member.department}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compare button */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleCompare}
          disabled={!canCompare}
          size="lg"
        >
          {compare.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4" />
              Compare {selectedMemberIds.length} Members
            </>
          )}
        </Button>
        {selectedMemberIds.length < 2 && selectedMemberIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Select at least one more member to compare.
          </p>
        )}
      </div>

      {/* Error state */}
      {compare.isError && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Comparison failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {compare.error?.message ?? "An unexpected error occurred."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state during comparison */}
      {compare.isPending && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Comparing members...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Evaluating {selectedMemberIds.length} members against{" "}
              {selectedProject?.name ?? "the selected project"}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {compare.data && <ComparisonResults result={compare.data} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison Results Section
// ---------------------------------------------------------------------------

function ComparisonResults({ result }: { result: ComparisonResult }) {
  const sortedRankings = useMemo(
    () => [...result.rankings].sort((a, b) => a.rank - b.rank),
    [result.rankings],
  );

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Results: {result.project_name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.rankings.length} members compared
        </p>
      </div>

      {/* Ranking table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Rankings</CardTitle>
          <CardDescription>
            Ordered by overall fit score, highest first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-center">Overall Score</TableHead>
                {sortedRankings[0]?.category_scores.map((cs) => (
                  <TableHead key={cs.category} className="text-center whitespace-nowrap">
                    {cs.category}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRankings.map((ranking) => (
                <TableRow key={ranking.member_id}>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {getRankIcon(ranking.rank)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {ranking.member_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <ScoreBadge score={ranking.overall_score} size="md" />
                  </TableCell>
                  {ranking.category_scores.map((cs) => (
                    <TableCell key={cs.category} className="text-center">
                      <ScoreBadge score={cs.score} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Score Heatmap</CardTitle>
          <CardDescription>
            Visual comparison of scores across categories. Darker green means
            higher score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapTable result={result} />
        </CardContent>
      </Card>

      {/* Grouped bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
          <CardDescription>
            Grouped bar chart showing each member&apos;s score per category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComparisonChart result={result} />
        </CardContent>
      </Card>
    </div>
  );
}
