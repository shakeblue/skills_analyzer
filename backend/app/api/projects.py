"""Projects API: GET /api/projects, GET /api/projects/{id}"""

from fastapi import APIRouter, HTTPException

from app.core.data_store import DataStore
from app.models.domain import ProjectProfile

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectProfile])
async def list_projects() -> list[ProjectProfile]:
    """Return all project profiles."""
    store = DataStore.get_instance()
    return store.get_projects()


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
