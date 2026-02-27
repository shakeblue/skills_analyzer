"""Members API: GET /api/members, GET /api/members/{id}"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.data_store import DataStore
from app.models.domain import TeamMember

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[TeamMember])
async def list_members(
    department: Optional[str] = Query(None, description="Filter by department"),
) -> list[TeamMember]:
    """Return all team members, optionally filtered by department."""
    store = DataStore.get_instance()
    if department:
        return store.get_members_by_department(department)
    return store.get_members()


@router.get("/{member_id}", response_model=TeamMember)
async def get_member(member_id: str) -> TeamMember:
    """Return a single team member by ID."""
    store = DataStore.get_instance()
    member = store.get_member(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail=f"Member {member_id} not found")
    return member


@router.get("/{member_id}/skills")
async def get_member_skills(member_id: str) -> dict:
    """Return the skill profile for a team member."""
    store = DataStore.get_instance()
    member = store.get_member(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail=f"Member {member_id} not found")
    profile = store.get_skill_profile_by_member(member_id)
    if profile is None:
        raise HTTPException(
            status_code=404, detail=f"No skill profile found for member {member_id}"
        )
    return profile.model_dump()
