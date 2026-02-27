"""Projects API: GET /api/projects, GET /api/projects/{id}, POST /api/projects"""

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.data_store import DataStore
from app.models.domain import ProjectProfile, SkillCategory

router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    """Request body for creating a new project profile."""

    name: str = Field(..., min_length=1, description="Project name")
    platform: str = Field(..., min_length=1, description="Target platform")
    description: str = Field(..., min_length=1, description="Brief project description")
    categories: list[SkillCategory] = Field(
        default_factory=list, description="Skill categories with requirements"
    )


@router.get("", response_model=list[ProjectProfile])
async def list_projects() -> list[ProjectProfile]:
    """Return all project profiles."""
    store = DataStore.get_instance()
    return store.get_projects()


@router.post("", response_model=ProjectProfile, status_code=201)
async def create_project(request: CreateProjectRequest) -> ProjectProfile:
    """Create a new project profile."""
    store = DataStore.get_instance()

    project = ProjectProfile(
        id=f"p-{uuid.uuid4().hex[:8]}",
        name=request.name,
        platform=request.platform,
        description=request.description,
        categories=request.categories,
    )

    store.add_project(project)
    return project


@router.get("/{project_id}", response_model=ProjectProfile)
async def get_project(project_id: str) -> ProjectProfile:
    """Return a single project profile by ID."""
    store = DataStore.get_instance()
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(
            status_code=404, detail=f"Project {project_id} not found"
        )
    return project
