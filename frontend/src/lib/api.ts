"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type {
  TeamMember,
  ProjectProfile,
  SkillProfile,
  Analysis,
  AnalysisRequest,
  CompareRequest,
  ComparisonResult,
  Roadmap,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Base fetch wrapper
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API error ${response.status}: ${errorBody}`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Query key factory - keeps keys consistent and easy to invalidate
// ---------------------------------------------------------------------------

export const queryKeys = {
  members: {
    all: ["members"] as const,
    list: (department?: string) =>
      department
        ? (["members", { department }] as const)
        : (["members"] as const),
    detail: (id: string) => ["members", id] as const,
    skills: (memberId: string) => ["members", memberId, "skills"] as const,
  },
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  analyses: {
    all: ["analyses"] as const,
    detail: (id: string) => ["analyses", id] as const,
  },
  roadmap: {
    byAnalysis: (analysisId: string) =>
      ["roadmap", analysisId] as const,
  },
  compare: {
    all: ["compare"] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

/** Fetch all team members, optionally filtered by department. */
export function useMembers(
  department?: string,
  options?: Omit<
    UseQueryOptions<TeamMember[]>,
    "queryKey" | "queryFn"
  >,
) {
  const params = department
    ? `?department=${encodeURIComponent(department)}`
    : "";

  return useQuery<TeamMember[]>({
    queryKey: queryKeys.members.list(department),
    queryFn: () => fetchApi<TeamMember[]>(`/api/members${params}`),
    ...options,
  });
}

/** Fetch a single team member by ID. */
export function useMember(
  id: string,
  options?: Omit<
    UseQueryOptions<TeamMember>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<TeamMember>({
    queryKey: queryKeys.members.detail(id),
    queryFn: () => fetchApi<TeamMember>(`/api/members/${id}`),
    enabled: !!id,
    ...options,
  });
}

/** Fetch the skill profile for a specific member. */
export function useMemberSkills(
  memberId: string,
  options?: Omit<
    UseQueryOptions<SkillProfile>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<SkillProfile>({
    queryKey: queryKeys.members.skills(memberId),
    queryFn: () =>
      fetchApi<SkillProfile>(`/api/members/${memberId}/skills`),
    enabled: !!memberId,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/** Fetch all project profiles. */
export function useProjects(
  options?: Omit<
    UseQueryOptions<ProjectProfile[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<ProjectProfile[]>({
    queryKey: queryKeys.projects.all,
    queryFn: () => fetchApi<ProjectProfile[]>("/api/projects"),
    ...options,
  });
}

/** Fetch a single project profile by ID. */
export function useProject(
  id: string,
  options?: Omit<
    UseQueryOptions<ProjectProfile>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<ProjectProfile>({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchApi<ProjectProfile>(`/api/projects/${id}`),
    enabled: !!id,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/** Fetch all analyses. */
export function useAnalyses(
  options?: Omit<
    UseQueryOptions<Analysis[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Analysis[]>({
    queryKey: queryKeys.analyses.all,
    queryFn: () => fetchApi<Analysis[]>("/api/analysis"),
    ...options,
  });
}

/** Fetch a single analysis by ID. */
export function useAnalysis(
  id: string,
  options?: Omit<
    UseQueryOptions<Analysis>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Analysis>({
    queryKey: queryKeys.analyses.detail(id),
    queryFn: () => fetchApi<Analysis>(`/api/analysis/${id}`),
    enabled: !!id,
    ...options,
  });
}

/** Create a new analysis (mutation). */
export function useCreateAnalysis() {
  return useMutation<Analysis, Error, AnalysisRequest>({
    mutationFn: (request) =>
      fetchApi<Analysis>("/api/analysis", {
        method: "POST",
        body: JSON.stringify(request),
      }),
  });
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

/** Compare multiple members against a project (mutation). */
export function useCompare() {
  return useMutation<ComparisonResult, Error, CompareRequest>({
    mutationFn: (request) =>
      fetchApi<ComparisonResult>("/api/compare", {
        method: "POST",
        body: JSON.stringify(request),
      }),
  });
}

// ---------------------------------------------------------------------------
// Roadmap
// ---------------------------------------------------------------------------

/** Fetch (or generate) a learning roadmap for a given analysis. */
export function useRoadmap(
  analysisId: string,
  options?: Omit<
    UseQueryOptions<Roadmap>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Roadmap>({
    queryKey: queryKeys.roadmap.byAnalysis(analysisId),
    queryFn: () =>
      fetchApi<Roadmap>(`/api/roadmap/${analysisId}`),
    enabled: !!analysisId,
    ...options,
  });
}
