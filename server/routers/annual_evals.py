"""API router for annual evaluation management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import AnnualEvaluation, Organization, QuarterlyEvaluation
from schemas.schemas import (
    AnnualEvalCreate,
    AnnualEvalResponse,
    AnnualEvalUpdate,
    MessageResponse,
)
from services.excel_service import export_annual_excel
from services.grading import assign_annual_grades
from services.scoring import calculate_annual_scores

router = APIRouter(prefix="/api/annual-evals", tags=["年度评价"])


@router.get("", response_model=list[AnnualEvalResponse])
async def list_annual_evals(
    year: int | None = Query(None),
    org_id: int | None = Query(None),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(AnnualEvaluation).order_by(AnnualEvaluation.id)
    if year is not None:
        stmt = stmt.where(AnnualEvaluation.year == year)
    if org_id is not None:
        stmt = stmt.where(AnnualEvaluation.org_id == org_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=AnnualEvalResponse, status_code=status.HTTP_201_CREATED)
async def create_annual_eval(
    data: AnnualEvalCreate, session: AsyncSession = Depends(get_db)
):
    org = await session.get(Organization, data.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="组织未找到")

    existing = await session.execute(
        select(AnnualEvaluation).where(
            AnnualEvaluation.org_id == data.org_id,
            AnnualEvaluation.year == data.year,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="该组织在该年度已存在评价记录")

    eval_obj = AnnualEvaluation(**data.model_dump())
    calculate_annual_scores(eval_obj)
    session.add(eval_obj)
    await session.flush()
    await session.refresh(eval_obj)
    return eval_obj


@router.post("/generate", response_model=list[AnnualEvalResponse])
async def generate_annual_evals(
    year: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    """Generate annual evaluations from quarterly data for all organizations."""
    # Get all orgs
    orgs_result = await session.execute(
        select(Organization).order_by(Organization.id)
    )
    orgs = list(orgs_result.scalars().all())

    created_evals: list[AnnualEvaluation] = []
    for org in orgs:
        # Check if annual eval already exists
        existing = await session.execute(
            select(AnnualEvaluation).where(
                AnnualEvaluation.org_id == org.id,
                AnnualEvaluation.year == year,
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Get quarterly data
        q_result = await session.execute(
            select(QuarterlyEvaluation).where(
                QuarterlyEvaluation.org_id == org.id,
                QuarterlyEvaluation.year == year,
            )
        )
        q_evals: list[QuarterlyEvaluation] = list(q_result.scalars().all())

        q_scores = {q.quarter: q.total_score for q in q_evals}

        annual = AnnualEvaluation(
            org_id=org.id,
            year=year,
            q1_total_score=q_scores.get(1, 0.0),
            q2_total_score=q_scores.get(2, 0.0),
            q3_total_score=q_scores.get(3, 0.0),
            q4_total_score=q_scores.get(4, 0.0),
        )
        calculate_annual_scores(annual)
        session.add(annual)
        created_evals.append(annual)

    if created_evals:
        await session.flush()
        for ev in created_evals:
            await session.refresh(ev)

    return created_evals


@router.get("/{eval_id}", response_model=AnnualEvalResponse)
async def get_annual_eval(eval_id: int, session: AsyncSession = Depends(get_db)):
    eval_obj = await session.get(AnnualEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="年度评价记录未找到")
    return eval_obj


@router.put("/{eval_id}", response_model=AnnualEvalResponse)
async def update_annual_eval(
    eval_id: int, data: AnnualEvalUpdate, session: AsyncSession = Depends(get_db)
):
    eval_obj = await session.get(AnnualEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="年度评价记录未找到")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(eval_obj, key, val)

    calculate_annual_scores(eval_obj)
    await session.flush()
    await session.refresh(eval_obj)
    return eval_obj


@router.delete("/{eval_id}", response_model=MessageResponse)
async def delete_annual_eval(
    eval_id: int, session: AsyncSession = Depends(get_db)
):
    eval_obj = await session.get(AnnualEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="年度评价记录未找到")
    await session.delete(eval_obj)
    return MessageResponse(message="年度评价记录已删除")


@router.post("/grade", response_model=dict)
async def grade_annual(
    year: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    """Assign grades (A/B/C) for all annual evaluations in a given year."""
    summary = await assign_annual_grades(session, year)
    return {"message": "年度评级完成", "summary": summary}


@router.get("/export/excel")
async def export_annual_excel_endpoint(
    year: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    buf = await export_annual_excel(session, year)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{year}年度创先争优评价结果.xlsx"'
        },
    )
