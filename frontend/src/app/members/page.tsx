"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  XCircle,
  Github,
  FileText,
  Code2,
  ArrowRight,
} from "lucide-react";

import { useMembers } from "@/lib/api";
import type { TeamMember } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract unique department values from member list. */
function getDepartments(members: TeamMember[]): string[] {
  const set = new Set(members.map((m) => m.department));
  return Array.from(set).sort();
}

/** Inline status indicator with icon. */
function StatusIndicator({
  active,
  label,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      title={active ? `${label} available` : `${label} not available`}
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-slate-300" />
      )}
      <span className="sr-only">
        {label} {active ? "available" : "not available"}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function MembersLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-1 h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members List Page
// ---------------------------------------------------------------------------

const ALL_DEPARTMENTS = "__all__";

export default function MembersPage() {
  const { data: members, isLoading, error } = useMembers();
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState(ALL_DEPARTMENTS);

  // Derive filtered members
  const filtered = React.useMemo(() => {
    if (!members) return [];
    let list = members;

    // Filter by department
    if (department !== ALL_DEPARTMENTS) {
      list = list.filter((m) => m.department === department);
    }

    // Filter by search term (name match, case insensitive)
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    return list;
  }, [members, search, department]);

  const departments = React.useMemo(
    () => (members ? getDepartments(members) : []),
    [members],
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Team Members
        </h1>
        <p className="mt-1 text-muted-foreground">
          Browse and search the team. Click a member to view their skill
          profile.
        </p>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search members by name"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by department">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_DEPARTMENTS}>All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Failed to load members. Please try again later.
        </div>
      )}

      {/* Loading state */}
      {isLoading && <MembersLoadingSkeleton />}

      {/* Members grid */}
      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {members && members.length > 0
                ? "No members match your search criteria."
                : "No team members found."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((member) => (
                <Card
                  key={member.id}
                  className="flex flex-col transition-colors hover:border-primary/40"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <Badge variant="secondary">{member.department}</Badge>
                    <div className="flex items-center gap-4">
                      <StatusIndicator
                        active={!!member.github_url}
                        label="GitHub"
                        icon={Github}
                      />
                      <StatusIndicator
                        active={member.cv_uploaded}
                        label="CV"
                        icon={FileText}
                      />
                      <StatusIndicator
                        active={member.code_uploaded}
                        label="Code"
                        icon={Code2}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/members/${member.id}`}>
                        View Profile
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Result count */}
          {filtered.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {filtered.length} of {members?.length ?? 0} member
              {(members?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}
