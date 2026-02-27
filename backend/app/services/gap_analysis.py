"""Gap analysis service: classifies each skill as Fully Met / Partially Met / Not Met."""

from __future__ import annotations

from typing import Literal

from app.models.domain import MemberSkill, ProjectProfile, SkillGap, SkillProfile


def _classify_gap(
    current_level: int, required_level: int
) -> Literal["fully_met", "partially_met", "not_met"]:
    """Classify the gap between current and required skill levels."""
    if current_level >= required_level:
        return "fully_met"
    if current_level >= required_level * 0.5:
        return "partially_met"
    return "not_met"


def analyze_gaps(
    project: ProjectProfile,
    skill_profile: SkillProfile,
) -> list[SkillGap]:
    """Identify skill gaps for a member against a project profile.

    Returns a list of SkillGap objects for every required skill,
    indicating whether the requirement is fully met, partially met, or not met.
    """
    skill_map: dict[str, MemberSkill] = {
        s.name.lower(): s for s in skill_profile.skills
    }

    gaps: list[SkillGap] = []

    for category in project.categories:
        for req in category.skills:
            member_skill = skill_map.get(req.name.lower())
            current_level = member_skill.level if member_skill else 0
            gap_status = _classify_gap(current_level, req.required_level)

            gaps.append(
                SkillGap(
                    skill=req.name,
                    category=category.name,
                    required_level=req.required_level,
                    current_level=current_level,
                    gap_status=gap_status,
                )
            )

    return gaps
