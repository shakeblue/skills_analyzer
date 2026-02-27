"""Scoring engine: calculates per-category and overall readiness scores.

Uses weighted category averaging to produce a 0-100 overall score.
"""

from __future__ import annotations

from app.models.domain import (
    CategoryScore,
    MemberSkill,
    ProjectProfile,
    SkillCategory,
    SkillProfile,
)


def _skill_lookup(profile: SkillProfile) -> dict[str, MemberSkill]:
    """Build a lowercase skill-name -> MemberSkill lookup dict."""
    return {s.name.lower(): s for s in profile.skills}


def score_category(
    category: SkillCategory,
    skill_map: dict[str, MemberSkill],
) -> CategoryScore:
    """Score a member against a single skill category.

    For each skill in the category the score contribution is:
        min(member_level, required_level) / required_level * 100

    The category score is the average across all its skills.
    """
    if not category.skills:
        return CategoryScore(
            category=category.name,
            score=0.0,
            weight=category.weight,
            weighted_score=0.0,
        )

    total = 0.0
    for req in category.skills:
        member_skill = skill_map.get(req.name.lower())
        member_level = member_skill.level if member_skill else 0
        skill_score = min(member_level, req.required_level) / req.required_level * 100
        total += skill_score

    raw_score = round(total / len(category.skills), 2)
    weighted = round(raw_score * category.weight, 2)

    return CategoryScore(
        category=category.name,
        score=raw_score,
        weight=category.weight,
        weighted_score=weighted,
    )


def calculate_scores(
    project: ProjectProfile,
    skill_profile: SkillProfile,
) -> tuple[float, list[CategoryScore]]:
    """Calculate overall and per-category scores for a member/project pair.

    Returns (overall_score, list_of_category_scores).
    """
    skill_map = _skill_lookup(skill_profile)
    category_scores: list[CategoryScore] = []

    for cat in project.categories:
        cat_score = score_category(cat, skill_map)
        category_scores.append(cat_score)

    overall = round(sum(cs.weighted_score for cs in category_scores), 2)
    return overall, category_scores
