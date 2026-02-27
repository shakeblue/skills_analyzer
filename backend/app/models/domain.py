"""Core domain models for the Skills & Project Fit Analyzer.

All domain entities are defined as Pydantic BaseModel classes using
Python 3.11+ features and Pydantic v2 patterns.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Team Members
# ---------------------------------------------------------------------------

class TeamMember(BaseModel):
    """Represents a team member whose skills can be analyzed."""

    model_config = ConfigDict(strict=False)

    id: str = Field(..., description="UUID identifying the team member")
    name: str = Field(..., min_length=1, description="Full name of the member")
    department: str = Field(..., description="Department the member belongs to")
    role: str = Field(..., description="Current job role / title")
    avatar_url: Optional[str] = Field(default=None, description="URL to avatar image")
    github_url: Optional[str] = Field(default=None, description="GitHub profile URL")
    cv_uploaded: bool = Field(default=False, description="Whether a CV has been uploaded")
    code_uploaded: bool = Field(
        default=False, description="Whether code samples have been uploaded"
    )
    created_at: str = Field(..., description="ISO-8601 creation timestamp")


# ---------------------------------------------------------------------------
# Project Profiles & Skill Requirements
# ---------------------------------------------------------------------------

class SkillRequirement(BaseModel):
    """A single skill required by a project, with level and importance."""

    name: str = Field(..., min_length=1, description="Skill name")
    required_level: int = Field(
        ..., ge=1, le=5, description="Required proficiency level (1-5)"
    )
    importance: Literal["critical", "important", "nice_to_have"] = Field(
        ..., description="How important this skill is for the project"
    )


class SkillCategory(BaseModel):
    """A category grouping related skill requirements with a weight."""

    name: str = Field(..., min_length=1, description="Category name")
    weight: float = Field(
        ..., ge=0.0, le=1.0, description="Weight of this category (0-1)"
    )
    skills: list[SkillRequirement] = Field(
        default_factory=list, description="Skills in this category"
    )


class ProjectProfile(BaseModel):
    """Defines a project and the skill requirements needed to succeed."""

    id: str = Field(..., description="UUID identifying the project profile")
    name: str = Field(..., min_length=1, description="Project name")
    platform: str = Field(..., description="Target platform (e.g. web, mobile, data)")
    description: str = Field(..., description="Brief project description")
    categories: list[SkillCategory] = Field(
        default_factory=list, description="Skill categories with requirements"
    )


# ---------------------------------------------------------------------------
# Skill Profiles (per member)
# ---------------------------------------------------------------------------

class EvidenceSource(BaseModel):
    """Describes where evidence for a skill assessment came from."""

    type: Literal["cv", "github", "code"] = Field(
        ..., description="Source type of the evidence"
    )
    detail: str = Field(..., description="Human-readable detail about the evidence")


class MemberSkill(BaseModel):
    """A single assessed skill for a team member."""

    name: str = Field(..., min_length=1, description="Skill name")
    level: int = Field(..., ge=1, le=5, description="Assessed proficiency level (1-5)")
    evidence_sources: list[EvidenceSource] = Field(
        default_factory=list, description="Sources supporting this assessment"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in the assessment (0-1)"
    )


class SkillProfile(BaseModel):
    """Aggregated skill profile for a team member."""

    id: str = Field(..., description="UUID identifying the skill profile")
    member_id: str = Field(..., description="UUID of the associated team member")
    skills: list[MemberSkill] = Field(
        default_factory=list, description="Assessed skills for this member"
    )


# ---------------------------------------------------------------------------
# Analysis Results
# ---------------------------------------------------------------------------

class CategoryScore(BaseModel):
    """Score for a single skill category in an analysis."""

    category: str = Field(..., description="Category name")
    score: float = Field(
        ..., ge=0.0, le=100.0, description="Raw score for this category (0-100)"
    )
    weight: float = Field(
        ..., ge=0.0, le=1.0, description="Weight applied to this category"
    )
    weighted_score: float = Field(
        ..., description="Score multiplied by weight"
    )


class SkillGap(BaseModel):
    """Identifies the gap between a required skill and a member's current level."""

    skill: str = Field(..., description="Skill name")
    category: str = Field(..., description="Category the skill belongs to")
    required_level: int = Field(
        ..., ge=1, le=5, description="Level required by the project"
    )
    current_level: int = Field(
        ..., ge=0, le=5, description="Member's current level (0 if not assessed)"
    )
    gap_status: Literal["fully_met", "partially_met", "not_met"] = Field(
        ..., description="Whether the requirement is met, partially met, or unmet"
    )


class Analysis(BaseModel):
    """Full analysis result comparing a member's skills against a project."""

    id: str = Field(..., description="UUID identifying this analysis")
    member_id: str = Field(..., description="UUID of the analyzed team member")
    project_id: str = Field(..., description="UUID of the project profile")
    overall_score: float = Field(
        ..., ge=0.0, le=100.0, description="Overall fit score (0-100)"
    )
    category_scores: list[CategoryScore] = Field(
        default_factory=list, description="Per-category score breakdown"
    )
    gaps: list[SkillGap] = Field(
        default_factory=list, description="Identified skill gaps"
    )
    created_at: str = Field(..., description="ISO-8601 creation timestamp")


# ---------------------------------------------------------------------------
# Learning Roadmap
# ---------------------------------------------------------------------------

class LearningResource(BaseModel):
    """A learning resource recommended to close a skill gap."""

    title: str = Field(..., min_length=1, description="Resource title")
    type: Literal["documentation", "course", "video", "tutorial", "practice"] = Field(
        ..., description="Type of learning resource"
    )
    url: str = Field(..., description="URL to the resource")
    estimated_hours: float = Field(
        ..., ge=0.0, description="Estimated hours to complete"
    )


class RoadmapItem(BaseModel):
    """A single item in a learning roadmap targeting a specific skill gap."""

    skill: str = Field(..., description="Skill to improve")
    priority: Literal["high", "medium", "low"] = Field(
        ..., description="Priority for addressing this gap"
    )
    current_level: int = Field(
        ..., ge=0, le=5, description="Member's current skill level"
    )
    target_level: int = Field(
        ..., ge=1, le=5, description="Target skill level to reach"
    )
    estimated_hours: float = Field(
        ..., ge=0.0, description="Total estimated hours to close the gap"
    )
    resources: list[LearningResource] = Field(
        default_factory=list, description="Recommended learning resources"
    )


class Roadmap(BaseModel):
    """A complete learning roadmap generated from an analysis."""

    id: str = Field(..., description="UUID identifying this roadmap")
    analysis_id: str = Field(
        ..., description="UUID of the analysis this roadmap is based on"
    )
    member_id: str = Field(..., description="UUID of the team member")
    project_id: str = Field(..., description="UUID of the project profile")
    total_hours: float = Field(
        ..., ge=0.0, description="Total estimated hours across all items"
    )
    items: list[RoadmapItem] = Field(
        default_factory=list, description="Ordered list of roadmap items"
    )
