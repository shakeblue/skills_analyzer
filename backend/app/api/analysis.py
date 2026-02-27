"""Analysis API: POST /api/analysis, GET /api/analysis/{id}"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.data_store import DataStore
from app.models.domain import Analysis
from app.models.schemas import AnalysisRequest
from app.services.gap_analysis import analyze_gaps
from app.services.scoring import calculate_scores

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("", response_model=Analysis)
async def create_analysis(request: AnalysisRequest) -> Analysis:
    """Run a skill-gap analysis for a member/project pair."""
    store = DataStore.get_instance()

    member = store.get_member(request.member_id)
    if member is None:
        raise HTTPException(
            status_code=404, detail=f"Member {request.member_id} not found"
        )

    project = store.get_project(request.project_id)
    if project is None:
        raise HTTPException(
            status_code=404, detail=f"Project {request.project_id} not found"
        )

    skill_profile = store.get_skill_profile_by_member(request.member_id)
    if skill_profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"No skill profile found for member {request.member_id}",
        )

    overall_score, category_scores = calculate_scores(project, skill_profile)
    gaps = analyze_gaps(project, skill_profile)

    analysis = Analysis(
        id=f"a-{uuid.uuid4().hex[:8]}",
        member_id=request.member_id,
        project_id=request.project_id,
        overall_score=overall_score,
        category_scores=category_scores,
        gaps=gaps,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    store.add_analysis(analysis)
    return analysis


@router.get("", response_model=list[Analysis])
async def list_analyses() -> list[Analysis]:
    """Return all analyses."""
    store = DataStore.get_instance()
    return store.get_analyses()


@router.get("/{analysis_id}", response_model=Analysis)
async def get_analysis(analysis_id: str) -> Analysis:
    """Return a single analysis by ID."""
    store = DataStore.get_instance()
    analysis = store.get_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(
            status_code=404, detail=f"Analysis {analysis_id} not found"
        )
    return analysis
