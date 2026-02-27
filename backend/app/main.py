"""FastAPI application entry point for Skills & Project Fit Analyzer."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analysis import router as analysis_router
from app.api.compare import router as compare_router
from app.api.members import router as members_router
from app.api.projects import router as projects_router
from app.api.roadmap import router as roadmap_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Skills & Project Fit Analyzer",
    description="API for analyzing team skills and project fit across members.",
    version="0.1.0",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(members_router)
app.include_router(projects_router)
app.include_router(analysis_router)
app.include_router(compare_router)
app.include_router(roadmap_router)


@app.get("/api/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint to verify the API is running."""
    return {"status": "healthy"}
