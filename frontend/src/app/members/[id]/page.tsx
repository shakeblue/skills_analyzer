"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Github,
  FileText,
  Code2,
  CheckCircle2,
  XCircle,
  Zap,
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
} from "recharts";

import { useMember, useMemberSkills } from "@/lib/api";
import type { MemberSkill, EvidenceSource } from "@/lib/types";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group skills by the first word of their name (rough categorization). */
function groupSkillsByArea(skills: MemberSkill[]): Record<string, MemberSkill[]> {
  const groups: Record<string, MemberSkill[]> = {};
  for (const skill of skills) {
    // Use first word as a rough area grouping.
    // If the skill name has "/" (e.g. "CI/CD"), keep it together.
    const area = skill.name.split(/[\s/]/)[0] || "Other";
    if (!groups[area]) {
      groups[area] = [];
    }
    groups[area].push(skill);
  }
  return groups;
}

/** Color for the bar based on skill level. */
function getBarColor(level: number): string {
  if (level >= 4) return "#059669"; // emerald-600
  if (level >= 3) return "#d97706"; // amber-600
  if (level >= 2) return "#ea580c"; // orange-600
  return "#dc2626"; // red-600
}

/** Map evidence source type to human-friendly label and icon. */
const evidenceConfig: Record<
  EvidenceSource["type"],
  { label: string; icon: React.ElementType }
> = {
  cv: { label: "CV", icon: FileText },
  github: { label: "GitHub", icon: Github },
  code: { label: "Code Sample", icon: Code2 },
};

// ---------------------------------------------------------------------------
// Source Status badge
// ---------------------------------------------------------------------------

function SourceBadge({
  active,
  label,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className={
        active
          ? "gap-1"
          : "gap-1 border-dashed text-muted-foreground"
      }
    >
      <Icon className="h-3 w-3" />
      {label}
      {active ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for the bar chart
// ---------------------------------------------------------------------------

interface ChartTooltipPayload {
  name: string;
  level: number;
  confidence: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartTooltipPayload }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        Level: {data.level}/5
      </p>
      <p className="text-xs text-muted-foreground">
        Confidence: {Math.round(data.confidence * 100)}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Profile Page
// ---------------------------------------------------------------------------

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;

  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useMember(memberId);

  const {
    data: skillProfile,
    isLoading: skillsLoading,
    error: skillsError,
  } = useMemberSkills(memberId);

  const isLoading = memberLoading || skillsLoading;
  const error = memberError || skillsError;

  // Derive chart data from skills
  const chartData = React.useMemo(() => {
    if (!skillProfile?.skills) return [];
    return skillProfile.skills
      .slice()
      .sort((a, b) => b.level - a.level)
      .map((s) => ({
        name: s.name,
        level: s.level,
        confidence: s.confidence,
      }));
  }, [skillProfile]);

  // Group skills by area
  const skillGroups = React.useMemo(() => {
    if (!skillProfile?.skills) return {};
    return groupSkillsByArea(skillProfile.skills);
  }, [skillProfile]);

  // Flatten all evidence sources across skills for the evidence tab
  const evidenceEntries = React.useMemo(() => {
    if (!skillProfile?.skills) return [];
    const entries: Array<{ skill: string; source: EvidenceSource }> = [];
    for (const skill of skillProfile.skills) {
      for (const source of skill.evidence_sources) {
        entries.push({ skill: skill.name, source });
      }
    }
    return entries;
  }, [skillProfile]);

  if (isLoading) {
    return <ProfileLoadingSkeleton />;
  }

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/members">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error
            ? "Failed to load member profile. Please try again later."
            : "Member not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/members">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Members
        </Link>
      </Button>

      {/* Member header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {member.name}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">{member.role}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{member.department}</Badge>
          <SourceBadge
            active={!!member.github_url}
            label="GitHub"
            icon={Github}
          />
          <SourceBadge
            active={member.cv_uploaded}
            label="CV"
            icon={FileText}
          />
          <SourceBadge
            active={member.code_uploaded}
            label="Code"
            icon={Code2}
          />
        </div>
      </div>

      {/* Action button */}
      <Button asChild>
        <Link href={`/analysis?member=${memberId}`}>
          <Zap className="h-4 w-4" />
          Run Analysis
        </Link>
      </Button>

      {/* Tabs: Skills | Chart | Evidence */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="chart">Skill Chart</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Sources</TabsTrigger>
        </TabsList>

        {/* ---- Skills tab ---- */}
        <TabsContent value="skills">
          {!skillProfile || skillProfile.skills.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No skills have been assessed for this member yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(skillGroups).map(([area, skills]) => (
                <Card key={area}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize">
                      {area}
                    </CardTitle>
                    <CardDescription>
                      {skills.length} skill{skills.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <SkillTag
                          key={skill.name}
                          name={skill.name}
                          level={skill.level}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Chart tab ---- */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skill Levels</CardTitle>
              <CardDescription>
                Bar chart showing assessed skill levels (1-5 scale)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No skill data available.
                </p>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 5]}
                        ticks={[0, 1, 2, 3, 4, 5]}
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="level" radius={[0, 4, 4, 0]} barSize={20}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry.level)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Evidence tab ---- */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence Sources</CardTitle>
              <CardDescription>
                Where each skill was assessed from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceEntries.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No evidence data available.
                </p>
              ) : (
                <div className="space-y-3">
                  {evidenceEntries.map((entry, idx) => {
                    const config = evidenceConfig[entry.source.type];
                    const EvidenceIcon = config.icon;
                    return (
                      <div
                        key={`${entry.skill}-${entry.source.type}-${idx}`}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100">
                          <EvidenceIcon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {entry.skill}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {config.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {entry.source.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
