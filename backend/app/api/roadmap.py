"""Roadmap API: GET /api/roadmap/{analysis_id}"""

from fastapi import APIRouter, HTTPException

from app.core.data_store import DataStore
from app.models.domain import Roadmap
from app.services.gap_analysis import analyze_gaps
from app.services.roadmap import generate_roadmap

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.get("/{analysis_id}", response_model=Roadmap)
async def get_roadmap(analysis_id: str) -> Roadmap:
    """Get or generate a roadmap for a completed analysis.

    If a roadmap already exists for this analysis, return it.
    Otherwise, generate one from the analysis gaps.
    """
    store = DataStore.get_instance()

    # Check if roadmap already exists
    existing = store.get_roadmap_by_analysis(analysis_id)
    if existing is not None:
        return existing

    # Find the analysis
    analysis = store.get_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(
            status_code=404, detail=f"Analysis {analysis_id} not found"
        )

    # Get project for re-generating gaps if needed
    project = store.get_project(analysis.project_id)
    if project is None:
        raise HTTPException(
            status_code=404,
            detail=f"Project {analysis.project_id} not found",
        )

    skill_profile = store.get_skill_profile_by_member(analysis.member_id)
    if skill_profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"No skill profile for member {analysis.member_id}",
        )

    gaps = analyze_gaps(project, skill_profile)
    roadmap = generate_roadmap(
        analysis_id=analysis_id,
        member_id=analysis.member_id,
        project_id=analysis.project_id,
        gaps=gaps,
    )

    store.add_roadmap(roadmap)
    return roadmap
