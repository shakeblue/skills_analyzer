"""JSON file-based data store for Phase 1 mock data.

Provides singleton access to all JSON data files with query and filter
operations. Designed to be swapped out for a real database in Phase 2.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from app.models.domain import (
    Analysis,
    ProjectProfile,
    Roadmap,
    SkillProfile,
    TeamMember,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class DataStore:
    """In-memory data store backed by JSON files."""

    _instance: Optional[DataStore] = None

    def __init__(self) -> None:
        self._members: list[TeamMember] = []
        self._projects: list[ProjectProfile] = []
        self._skill_profiles: list[SkillProfile] = []
        self._analyses: list[Analysis] = []
        self._roadmaps: list[Roadmap] = []
        self._loaded = False

    @classmethod
    def get_instance(cls) -> DataStore:
        """Return the singleton DataStore, creating it if needed."""
        if cls._instance is None:
            cls._instance = cls()
        if not cls._instance._loaded:
            cls._instance._load_all()
        return cls._instance

    def _load_json(self, filename: str) -> list[dict[str, Any]]:
        """Load a JSON file from the data directory."""
        filepath = DATA_DIR / filename
        if not filepath.exists():
            return []
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []

    def _load_all(self) -> None:
        """Load all JSON data files into memory."""
        self._members = [
            TeamMember(**m) for m in self._load_json("members.json")
        ]
        self._projects = [
            ProjectProfile(**p) for p in self._load_json("project_profiles.json")
        ]
        self._skill_profiles = [
            SkillProfile(**sp) for sp in self._load_json("skill_profiles.json")
        ]
        self._analyses = [
            Analysis(**a) for a in self._load_json("analyses.json")
        ]
        self._roadmaps = [
            Roadmap(**r) for r in self._load_json("roadmaps.json")
        ]
        self._loaded = True

    def reload(self) -> None:
        """Force reload all data from JSON files."""
        self._loaded = False
        self._load_all()

    # ---- Members ----

    def get_members(self) -> list[TeamMember]:
        return list(self._members)

    def get_member(self, member_id: str) -> Optional[TeamMember]:
        return next((m for m in self._members if m.id == member_id), None)

    def get_members_by_department(self, department: str) -> list[TeamMember]:
        return [m for m in self._members if m.department.lower() == department.lower()]

    # ---- Projects ----

    def get_projects(self) -> list[ProjectProfile]:
        return list(self._projects)

    def get_project(self, project_id: str) -> Optional[ProjectProfile]:
        return next((p for p in self._projects if p.id == project_id), None)

    def add_project(self, project: ProjectProfile) -> None:
        self._projects.append(project)

    # ---- Skill Profiles ----

    def get_skill_profiles(self) -> list[SkillProfile]:
        return list(self._skill_profiles)

    def get_skill_profile(self, profile_id: str) -> Optional[SkillProfile]:
        return next((sp for sp in self._skill_profiles if sp.id == profile_id), None)

    def get_skill_profile_by_member(self, member_id: str) -> Optional[SkillProfile]:
        return next(
            (sp for sp in self._skill_profiles if sp.member_id == member_id), None
        )

    # ---- Analyses ----

    def get_analyses(self) -> list[Analysis]:
        return list(self._analyses)

    def get_analysis(self, analysis_id: str) -> Optional[Analysis]:
        return next((a for a in self._analyses if a.id == analysis_id), None)

    def add_analysis(self, analysis: Analysis) -> None:
        self._analyses.append(analysis)

    # ---- Roadmaps ----

    def get_roadmaps(self) -> list[Roadmap]:
        return list(self._roadmaps)

    def get_roadmap(self, roadmap_id: str) -> Optional[Roadmap]:
        return next((r for r in self._roadmaps if r.id == roadmap_id), None)

    def get_roadmap_by_analysis(self, analysis_id: str) -> Optional[Roadmap]:
        return next(
            (r for r in self._roadmaps if r.analysis_id == analysis_id), None
        )

    def add_roadmap(self, roadmap: Roadmap) -> None:
        self._roadmaps.append(roadmap)
