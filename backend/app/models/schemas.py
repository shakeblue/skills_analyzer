"""API request/response schemas for the Skills & Project Fit Analyzer.

These schemas wrap domain models for use in API endpoints, providing
standardised request validation and response formatting.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.domain import CategoryScore


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class AnalysisRequest(BaseModel):
    """Request body to trigger a skill-gap analysis for a member/project pair."""

    member_id: str = Field(..., description="UUID of the team member to analyze")
    project_id: str = Field(..., description="UUID of the project profile to compare against")


class CompareRequest(BaseModel):
    """Request body to compare multiple members against a single project."""

    member_ids: list[str] = Field(
        ..., min_length=1, description="List of team member UUIDs to compare"
    )
    project_id: str = Field(..., description="UUID of the project profile")


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class MemberRanking(BaseModel):
    """Ranking entry for a single member within a comparison."""

    member_id: str = Field(..., description="UUID of the team member")
    member_name: str = Field(..., description="Display name of the team member")
    overall_score: float = Field(
        ..., ge=0.0, le=100.0, description="Overall fit score (0-100)"
    )
    category_scores: list[CategoryScore] = Field(
        default_factory=list, description="Per-category score breakdown"
    )
    rank: int = Field(..., ge=1, description="Rank position (1 = best fit)")


class ComparisonResult(BaseModel):
    """Result of comparing multiple members against a project."""

    project_id: str = Field(..., description="UUID of the project profile")
    project_name: str = Field(..., description="Name of the project profile")
    rankings: list[MemberRanking] = Field(
        default_factory=list, description="Members ranked by fit score"
    )


class ApiResponse(BaseModel):
    """Generic API response wrapper for consistent response formatting."""

    success: bool = Field(default=True, description="Whether the request succeeded")
    data: Any = Field(default=None, description="Response payload")
    message: Optional[str] = Field(
        default=None, description="Optional human-readable message"
    )
