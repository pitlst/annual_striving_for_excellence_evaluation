"""Grading engine — assigns A/B/C grades and computes final evaluation result."""

import json
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import EvaluationRule, QuarterlyEvaluation, AnnualEvaluation


async def assign_quarterly_grades(
    session: AsyncSession, year: int, quarter: int
) -> dict[str, list[dict]]:
    """Assign party_mass_grade for all quarterly evals in (year, quarter) by group ranking.

    Grades are assigned per group based on total_score ranking:
    - Top 40% → A, next 40% → B, bottom 20% → C
    """
    result = await session.execute(
        select(QuarterlyEvaluation).where(
            QuarterlyEvaluation.year == year, QuarterlyEvaluation.quarter == quarter
        )
    )
    evals: list[QuarterlyEvaluation] = list(result.scalars().all())

    # Group by org group
    from models.models import Organization

    groups: dict[str, list[QuarterlyEvaluation]] = defaultdict(list)
    for ev in evals:
        org = await session.get(Organization, ev.org_id)
        if org:
            groups[org.group].append(ev)

    summary: dict[str, list[dict]] = {}
    for group_name, group_evals in groups.items():
        # Fetch rule for this group
        rule_result = await session.execute(
            select(EvaluationRule).where(EvaluationRule.group_name == group_name)
        )
        rule = rule_result.scalar_one_or_none()
        if not rule:
            continue

        # Sort by total_score descending
        sorted_evals = sorted(group_evals, key=lambda e: e.total_score, reverse=True)
        n = len(sorted_evals)
        a_count = max(1, round(n * rule.grade_a_ratio))
        b_count = max(1, round(n * rule.grade_b_ratio))

        group_summary: list[dict] = []
        for i, ev in enumerate(sorted_evals):
            if i < a_count:
                grade = "A"
            elif i < a_count + b_count:
                grade = "B"
            else:
                grade = "C"
            ev.party_mass_grade = grade

            # Compute final grade from matrix
            if ev.admin_grade and ev.admin_grade in ("A", "B", "C"):
                key = f"{grade}_{ev.admin_grade}"
                matrix = json.loads(rule.matrix_data)
                ev.final_grade = matrix.get(key, "C")
            else:
                ev.final_grade = None

            group_summary.append(
                {
                    "id": ev.id,
                    "org_id": ev.org_id,
                    "total_score": ev.total_score,
                    "party_mass_grade": ev.party_mass_grade,
                    "admin_grade": ev.admin_grade,
                    "final_grade": ev.final_grade,
                }
            )
        summary[group_name] = group_summary

    await session.commit()
    return summary


async def assign_annual_grades(
    session: AsyncSession, year: int
) -> dict[str, list[dict]]:
    """Assign party_mass_grade for all annual evals in the given year by group ranking."""
    result = await session.execute(
        select(AnnualEvaluation).where(AnnualEvaluation.year == year)
    )
    evals: list[AnnualEvaluation] = list(result.scalars().all())

    from models.models import Organization

    groups: dict[str, list[AnnualEvaluation]] = defaultdict(list)
    for ev in evals:
        org = await session.get(Organization, ev.org_id)
        if org:
            groups[org.group].append(ev)

    summary: dict[str, list[dict]] = {}
    for group_name, group_evals in groups.items():
        rule_result = await session.execute(
            select(EvaluationRule).where(EvaluationRule.group_name == group_name)
        )
        rule = rule_result.scalar_one_or_none()
        if not rule:
            continue

        sorted_evals = sorted(group_evals, key=lambda e: e.total_score, reverse=True)
        n = len(sorted_evals)
        a_count = max(1, round(n * rule.grade_a_ratio))
        b_count = max(1, round(n * rule.grade_b_ratio))

        group_summary: list[dict] = []
        for i, ev in enumerate(sorted_evals):
            if i < a_count:
                grade = "A"
            elif i < a_count + b_count:
                grade = "B"
            else:
                grade = "C"
            ev.party_mass_grade = grade

            # Compute final grade
            if ev.admin_grade and ev.admin_grade in ("A", "B", "C"):
                key = f"{grade}_{ev.admin_grade}"
                matrix = json.loads(rule.matrix_data)
                ev.final_grade = matrix.get(key, "C")
            else:
                ev.final_grade = None

            group_summary.append(
                {
                    "id": ev.id,
                    "org_id": ev.org_id,
                    "total_score": ev.total_score,
                    "party_mass_grade": ev.party_mass_grade,
                    "admin_grade": ev.admin_grade,
                    "final_grade": ev.final_grade,
                }
            )
        summary[group_name] = group_summary

    await session.commit()
    return summary
