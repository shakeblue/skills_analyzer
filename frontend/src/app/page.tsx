"use client";

import Link from "next/link";
import {
  Users,
  FolderKanban,
  Activity,
  ArrowRight,
  GitCompare,
  Zap,
} from "lucide-react";

import { useMembers, useProjects, useAnalyses } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: analyses, isLoading: analysesLoading } = useAnalyses();

  const isLoading = membersLoading || projectsLoading || analysesLoading;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. Here is an overview of your team and projects.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[104px] rounded-xl" />
            <Skeleton className="h-[104px] rounded-xl" />
            <Skeleton className="h-[104px] rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Members"
              value={members?.length ?? 0}
              icon={Users}
            />
            <StatCard
              label="Total Projects"
              value={projects?.length ?? 0}
              icon={FolderKanban}
            />
            <StatCard
              label="Recent Analyses"
              value={analyses?.length ?? 0}
              icon={Activity}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/analysis">
            <Zap className="h-4 w-4" />
            Run Analysis
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/compare">
            <GitCompare className="h-4 w-4" />
            Compare Members
          </Link>
        </Button>
      </div>

      {/* Team Members section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Team Members
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/members">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {membersLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-xl" />
            ))
          ) : members && members.length > 0 ? (
            members.slice(0, 4).map((member) => (
              <Link key={member.id} href={`/members/${member.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{member.department}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">
              No team members found.
            </p>
          )}
        </div>
      </section>

      {/* Project Profiles section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Project Profiles
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projectsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] rounded-xl" />
            ))
          ) : projects && projects.length > 0 ? (
            projects.slice(0, 4).map((project) => {
              const totalSkills = project.categories.reduce(
                (acc, cat) => acc + cat.skills.length,
                0,
              );

              return (
                <Card key={project.id} className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{project.platform}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {totalSkills} skill{totalSkills !== 1 ? "s" : ""}{" "}
                        required
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">
              No projects found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
