// Shared TypeScript interfaces - mirrors backend Pydantic schemas exactly

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  name: string;
  department: string;
  role: string;
  avatar_url?: string | null;
  github_url?: string | null;
  cv_uploaded: boolean;
  code_uploaded: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Project Profiles & Skill Requirements
// ---------------------------------------------------------------------------

export interface SkillRequirement {
  name: string;
  required_level: number;
  importance: "critical" | "important" | "nice_to_have";
}

export interface SkillCategory {
  name: string;
  weight: number;
  skills: SkillRequirement[];
}

export interface ProjectProfile {
  id: string;
  name: string;
  platform: string;
  description: string;
  categories: SkillCategory[];
}

// ---------------------------------------------------------------------------
// Skill Profiles (per member)
// ---------------------------------------------------------------------------

export interface EvidenceSource {
  type: "cv" | "github" | "code";
  detail: string;
}

export interface MemberSkill {
  name: string;
  level: number;
  evidence_sources: EvidenceSource[];
  confidence: number;
}

export interface SkillProfile {
  id: string;
  member_id: string;
  skills: MemberSkill[];
}

// ---------------------------------------------------------------------------
// Analysis Results
// ---------------------------------------------------------------------------

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  weighted_score: number;
}

export interface SkillGap {
  skill: string;
  category: string;
  required_level: number;
  current_level: number;
  gap_status: "fully_met" | "partially_met" | "not_met";
}

export interface Analysis {
  id: string;
  member_id: string;
  project_id: string;
  overall_score: number;
  category_scores: CategoryScore[];
  gaps: SkillGap[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Learning Roadmap
// ---------------------------------------------------------------------------

export interface LearningResource {
  title: string;
  type: "documentation" | "course" | "video" | "tutorial" | "practice";
  url: string;
  estimated_hours: number;
}

export interface RoadmapItem {
  skill: string;
  priority: "high" | "medium" | "low";
  current_level: number;
  target_level: number;
  estimated_hours: number;
  resources: LearningResource[];
}

export interface Roadmap {
  id: string;
  analysis_id: string;
  member_id: string;
  project_id: string;
  total_hours: number;
  items: RoadmapItem[];
}

// ---------------------------------------------------------------------------
// API Request/Response Schemas
// ---------------------------------------------------------------------------

export interface AnalysisRequest {
  member_id: string;
  project_id: string;
}

export interface CompareRequest {
  member_ids: string[];
  project_id: string;
}

export interface MemberRanking {
  member_id: string;
  member_name: string;
  overall_score: number;
  category_scores: CategoryScore[];
  rank: number;
}

export interface ComparisonResult {
  project_id: string;
  project_name: string;
  rankings: MemberRanking[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string | null;
}
