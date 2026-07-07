"""API router for evaluation rule configuration."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import EvaluationRule
from schemas.schemas import EvalRuleResponse, EvalRuleUpdate

router = APIRouter(prefix="/api/eval-rules", tags=["评价规则"])


@router.get("", response_model=list[EvalRuleResponse])
async def list_rules(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(EvaluationRule).order_by(EvaluationRule.id))
    return list(result.scalars().all())


@router.get("/{group_name}", response_model=EvalRuleResponse)
async def get_rule(group_name: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(EvaluationRule).where(EvaluationRule.group_name == group_name)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="未找到该分组的规则")
    return rule


@router.put("/{group_name}", response_model=EvalRuleResponse)
async def update_rule(
    group_name: str, data: EvalRuleUpdate, session: AsyncSession = Depends(get_db)
):
    result = await session.execute(
        select(EvaluationRule).where(EvaluationRule.group_name == group_name)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="未找到该分组的规则")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(rule, key, val)

    await session.flush()
    await session.refresh(rule)
    return rule
