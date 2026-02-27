"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Loader2,
  User,
  FolderKanban,
  AlertCircle,
} from "lucide-react";

import { useMembers, useProjects, useCreateAnalysis } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Run Analysis page
// ---------------------------------------------------------------------------

export default function RunAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <RunAnalysisInner />
    </Suspense>
  );
}

function RunAnalysisInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-select from URL params
  const preselectedMember = searchParams.get("member") ?? "";
  const preselectedProject = searchParams.get("project") ?? "";

  const [memberId, setMemberId] = useState(preselectedMember);
  const [projectId, setProjectId] = useState(preselectedProject);

  // Sync if URL params change (e.g. navigating with different params)
  useEffect(() => {
    if (preselectedMember) setMemberId(preselectedMember);
    if (preselectedProject) setProjectId(preselectedProject);
  }, [preselectedMember, preselectedProject]);

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const createAnalysis = useCreateAnalysis();

  const isDataLoading = membersLoading || projectsLoading;
  const canSubmit = memberId && projectId && !createAnalysis.isPending;

  const selectedMember = members?.find((m) => m.id === memberId);
  const selectedProject = projects?.find((p) => p.id === projectId);

  function handleRunAnalysis() {
    if (!memberId || !projectId) return;

    createAnalysis.mutate(
      { member_id: memberId, project_id: projectId },
      {
        onSuccess: (analysis) => {
          router.push(`/analysis/${analysis.id}`);
        },
      },
    );
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
          Run Analysis
        </h1>
        <p className="mt-1 text-muted-foreground">
          Select a team member and a project to analyze skill fit.
        </p>
      </div>

      {/* Selection card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configure Analysis</CardTitle>
          <CardDescription>
            Choose who to analyze and which project to evaluate against.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Select Member */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
              <label
                htmlFor="member-select"
                className="text-sm font-medium leading-none"
              >
                Select Team Member
              </label>
            </div>

            {membersLoading ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger id="member-select" className="w-full">
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {member.name}
                        <span className="text-muted-foreground">
                          - {member.role}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedMember && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedMember.name}</span>
                <Badge variant="secondary">{selectedMember.department}</Badge>
                <span className="text-muted-foreground">
                  {selectedMember.role}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Select Project */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </div>
              <label
                htmlFor="project-select"
                className="text-sm font-medium leading-none"
              >
                Select Project
              </label>
            </div>

            {projectsLoading ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project-select" className="w-full">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <span className="flex items-center gap-2">
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                        {project.name}
                        <span className="text-muted-foreground">
                          ({project.platform})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedProject && (
              <div className="space-y-1 rounded-md bg-muted px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedProject.name}</span>
                  <Badge variant="outline">{selectedProject.platform}</Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2">
                  {selectedProject.description}
                </p>
              </div>
            )}
          </div>

          {/* Error state */}
          {createAnalysis.isError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Analysis failed</p>
                <p className="mt-1 text-destructive/80">
                  {createAnalysis.error?.message ?? "An unexpected error occurred."}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleRunAnalysis}
            disabled={!canSubmit}
            size="lg"
            className="w-full sm:w-auto"
          >
            {createAnalysis.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Loading overlay for full-screen feel during analysis */}
      {createAnalysis.isPending && (
        <Card className="max-w-2xl border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Analyzing skill fit...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparing {selectedMember?.name ?? "member"} against{" "}
              {selectedProject?.name ?? "project"} requirements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
