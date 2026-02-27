"use client";

import * as React from "react";
import Link from "next/link";
import { useProjects } from "@/lib/api";
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
import {
  FolderKanban,
  Layers,
  Wrench,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// ProjectsPage -- lists all project profiles in a responsive card grid
// ---------------------------------------------------------------------------

function ProjectCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );
}

export default function ProjectsPage() {
  const { data: projects, isLoading, isError, error } = useProjects();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Project Profiles
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse project skill requirements and run fit analyses.
        </p>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Failed to load projects.{" "}
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      )}

      {/* Loading skeleton grid */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && projects?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-16 text-center">
          <FolderKanban className="h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">
            No projects yet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Project profiles will appear here once created.
          </p>
        </div>
      )}

      {/* Project cards grid */}
      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalSkills = project.categories.reduce(
              (sum, cat) => sum + cat.skills.length,
              0,
            );

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {project.platform}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      {project.categories.length}{" "}
                      {project.categories.length === 1
                        ? "category"
                        : "categories"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Wrench className="h-4 w-4" />
                      {totalSkills} {totalSkills === 1 ? "skill" : "skills"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View Details
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
