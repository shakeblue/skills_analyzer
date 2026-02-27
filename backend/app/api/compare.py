"""Compare API: POST /api/compare (multiple members vs one project)"""

from fastapi import APIRouter, HTTPException

from app.core.data_store import DataStore
from app.models.schemas import CompareRequest, ComparisonResult, MemberRanking
from app.services.scoring import calculate_scores

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.post("", response_model=ComparisonResult)
async def compare_members(request: CompareRequest) -> ComparisonResult:
    """Compare multiple members against a single project, returning ranked results."""
    store = DataStore.get_instance()

    project = store.get_project(request.project_id)
    if project is None:
        raise HTTPException(
            status_code=404, detail=f"Project {request.project_id} not found"
        )

    # Collect scores first, then sort and assign ranks
    scored: list[tuple[str, str, float, list]] = []

    for member_id in request.member_ids:
        member = store.get_member(member_id)
        if member is None:
            raise HTTPException(
                status_code=404, detail=f"Member {member_id} not found"
            )

        skill_profile = store.get_skill_profile_by_member(member_id)
        if skill_profile is None:
            raise HTTPException(
                status_code=404,
                detail=f"No skill profile found for member {member_id}",
            )

        overall_score, category_scores = calculate_scores(project, skill_profile)
        scored.append((member_id, member.name, overall_score, category_scores))

    # Sort by score descending and build rankings with correct rank
    scored.sort(key=lambda x: x[2], reverse=True)
    rankings = [
        MemberRanking(
            member_id=mid,
            member_name=mname,
            overall_score=score,
            category_scores=cats,
            rank=i,
        )
        for i, (mid, mname, score, cats) in enumerate(scored, start=1)
    ]

    return ComparisonResult(
        project_id=project.id,
        project_name=project.name,
        rankings=rankings,
    )
