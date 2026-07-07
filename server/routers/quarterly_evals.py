"""API router for quarterly evaluation management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Organization, QuarterlyEvaluation
from schemas.schemas import (
    MessageResponse,
    QuarterlyEvalCreate,
    QuarterlyEvalResponse,
    QuarterlyEvalUpdate,
)
from services.excel_service import export_quarterly_excel
from services.grading import assign_quarterly_grades
from services.scoring import calculate_quarterly_scores

router = APIRouter(prefix="/api/quarterly-evals", tags=["季度评价"])


@router.get("", response_model=list[QuarterlyEvalResponse])
async def list_quarterly_evals(
    year: int | None = Query(None),
    quarter: int | None = Query(None),
    org_id: int | None = Query(None),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(QuarterlyEvaluation).order_by(QuarterlyEvaluation.id)
    if year is not None:
        stmt = stmt.where(QuarterlyEvaluation.year == year)
    if quarter is not None:
        stmt = stmt.where(QuarterlyEvaluation.quarter == quarter)
    if org_id is not None:
        stmt = stmt.where(QuarterlyEvaluation.org_id == org_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=QuarterlyEvalResponse, status_code=status.HTTP_201_CREATED)
async def create_quarterly_eval(
    data: QuarterlyEvalCreate, session: AsyncSession = Depends(get_db)
):
    # Check org exists
    org = await session.get(Organization, data.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="组织未找到")

    # Check uniqueness
    existing = await session.execute(
        select(QuarterlyEvaluation).where(
            QuarterlyEvaluation.org_id == data.org_id,
            QuarterlyEvaluation.year == data.year,
            QuarterlyEvaluation.quarter == data.quarter,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="该组织在该季度已存在评价记录")

    eval_obj = QuarterlyEvaluation(**data.model_dump())
    calculate_quarterly_scores(eval_obj)
    session.add(eval_obj)
    await session.flush()
    await session.refresh(eval_obj)
    return eval_obj


@router.get("/{eval_id}", response_model=QuarterlyEvalResponse)
async def get_quarterly_eval(eval_id: int, session: AsyncSession = Depends(get_db)):
    eval_obj = await session.get(QuarterlyEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="评价记录未找到")
    return eval_obj


@router.put("/{eval_id}", response_model=QuarterlyEvalResponse)
async def update_quarterly_eval(
    eval_id: int, data: QuarterlyEvalUpdate, session: AsyncSession = Depends(get_db)
):
    eval_obj = await session.get(QuarterlyEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="评价记录未找到")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(eval_obj, key, val)

    # Recalculate
    calculate_quarterly_scores(eval_obj)
    await session.flush()
    await session.refresh(eval_obj)
    return eval_obj


@router.delete("/{eval_id}", response_model=MessageResponse)
async def delete_quarterly_eval(
    eval_id: int, session: AsyncSession = Depends(get_db)
):
    eval_obj = await session.get(QuarterlyEvaluation, eval_id)
    if not eval_obj:
        raise HTTPException(status_code=404, detail="评价记录未找到")
    await session.delete(eval_obj)
    return MessageResponse(message="评价记录已删除")


@router.post("/grade", response_model=dict)
async def grade_quarterly(
    year: int = Query(...),
    quarter: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    """Assign grades (A/B/C) for all quarterly evaluations in a given period."""
    summary = await assign_quarterly_grades(session, year, quarter)
    return {"message": "评级完成", "summary": summary}


@router.get("/export/excel")
async def export_quarterly_excel_endpoint(
    year: int = Query(...),
    quarter: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    buf = await export_quarterly_excel(session, year, quarter)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{year}年第{quarter}季度创先争优评价结果.xlsx"'
        },
    )
