"""Roadmap generation service: converts gaps into ordered learning paths with mock resources."""

from __future__ import annotations

import uuid
from typing import Literal

from app.models.domain import LearningResource, Roadmap, RoadmapItem, SkillGap

# Mock learning resources per skill area
_RESOURCE_TEMPLATES: dict[str, list[dict[str, str | float]]] = {
    "php": [
        {"title": "PHP 8 Official Documentation", "type": "documentation", "url": "https://www.php.net/manual/en/", "hours": 8.0},
        {"title": "PHP: The Right Way", "type": "tutorial", "url": "https://phptherightway.com/", "hours": 12.0},
        {"title": "PHP 8 New Features Course", "type": "course", "url": "#", "hours": 6.0},
    ],
    "javascript": [
        {"title": "MDN JavaScript Guide", "type": "documentation", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "hours": 10.0},
        {"title": "JavaScript.info", "type": "tutorial", "url": "https://javascript.info/", "hours": 15.0},
    ],
    "typescript": [
        {"title": "TypeScript Handbook", "type": "documentation", "url": "https://www.typescriptlang.org/docs/handbook/", "hours": 8.0},
        {"title": "TypeScript Deep Dive", "type": "tutorial", "url": "#", "hours": 12.0},
    ],
    "react": [
        {"title": "React Official Documentation", "type": "documentation", "url": "https://react.dev/", "hours": 10.0},
        {"title": "React Patterns Course", "type": "course", "url": "#", "hours": 8.0},
    ],
    "next.js": [
        {"title": "Next.js Documentation", "type": "documentation", "url": "https://nextjs.org/docs", "hours": 10.0},
        {"title": "Next.js App Router Tutorial", "type": "tutorial", "url": "#", "hours": 6.0},
    ],
    "node.js": [
        {"title": "Node.js Official Docs", "type": "documentation", "url": "https://nodejs.org/en/docs/", "hours": 8.0},
        {"title": "Node.js Design Patterns", "type": "course", "url": "#", "hours": 12.0},
    ],
    "docker": [
        {"title": "Docker Official Documentation", "type": "documentation", "url": "https://docs.docker.com/", "hours": 6.0},
        {"title": "Docker Hands-On Labs", "type": "practice", "url": "#", "hours": 8.0},
    ],
    "database": [
        {"title": "Database Fundamentals", "type": "course", "url": "#", "hours": 10.0},
        {"title": "Query Optimization Guide", "type": "tutorial", "url": "#", "hours": 6.0},
    ],
    "default": [
        {"title": "Official Documentation", "type": "documentation", "url": "#", "hours": 8.0},
        {"title": "Practical Exercises", "type": "practice", "url": "#", "hours": 10.0},
        {"title": "Video Tutorial Series", "type": "video", "url": "#", "hours": 5.0},
    ],
}


def _get_resources(skill_name: str) -> list[LearningResource]:
    """Look up mock learning resources for a skill."""
    key = skill_name.lower()
    # Try matching against known categories
    for keyword, templates in _RESOURCE_TEMPLATES.items():
        if keyword != "default" and keyword in key:
            return [
                LearningResource(
                    title=t["title"],  # type: ignore[arg-type]
                    type=t["type"],  # type: ignore[arg-type]
                    url=str(t["url"]),
                    estimated_hours=float(t["hours"]),
                )
                for t in templates
            ]
    # Fallback to generic resources
    return [
        LearningResource(
            title=f"{skill_name} - {t['title']}",
            type=t["type"],  # type: ignore[arg-type]
            url=str(t["url"]),
            estimated_hours=float(t["hours"]),
        )
        for t in _RESOURCE_TEMPLATES["default"]
    ]


def _gap_priority(gap: SkillGap) -> Literal["high", "medium", "low"]:
    """Determine priority based on the gap severity."""
    diff = gap.required_level - gap.current_level
    if diff >= 3:
        return "high"
    if diff >= 2:
        return "medium"
    return "low"


def _estimate_hours(current: int, target: int) -> float:
    """Estimate hours to close a skill gap."""
    diff = target - current
    # Rough estimate: each level gap ~ 10-20 hours
    base = {1: 10.0, 2: 25.0, 3: 45.0, 4: 70.0, 5: 100.0}
    return base.get(diff, diff * 15.0)


def generate_roadmap(
    analysis_id: str,
    member_id: str,
    project_id: str,
    gaps: list[SkillGap],
) -> Roadmap:
    """Generate a learning roadmap from identified skill gaps.

    Only includes skills that are partially met or not met.
    Items are ordered by priority (high first) then by gap size.
    """
    items: list[RoadmapItem] = []

    # Filter to only gaps that need work
    actionable_gaps = [g for g in gaps if g.gap_status != "fully_met"]

    # Sort by gap severity (largest gap first)
    actionable_gaps.sort(
        key=lambda g: g.required_level - g.current_level, reverse=True
    )

    for gap in actionable_gaps:
        est_hours = _estimate_hours(gap.current_level, gap.required_level)
        resources = _get_resources(gap.skill)

        items.append(
            RoadmapItem(
                skill=gap.skill,
                priority=_gap_priority(gap),
                current_level=gap.current_level,
                target_level=gap.required_level,
                estimated_hours=est_hours,
                resources=resources,
            )
        )

    total_hours = round(sum(item.estimated_hours for item in items), 1)

    return Roadmap(
        id=f"rm-{uuid.uuid4().hex[:8]}",
        analysis_id=analysis_id,
        member_id=member_id,
        project_id=project_id,
        total_hours=total_hours,
        items=items,
    )
