"""API router for organization management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Organization
from schemas.schemas import (
    MessageResponse,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)

router = APIRouter(prefix="/api/organizations", tags=["组织管理"])


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Organization).order_by(Organization.group, Organization.id)
    )
    return list(result.scalars().all())


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate, session: AsyncSession = Depends(get_db)
):
    existing = await session.execute(
        select(Organization).where(Organization.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="该党组织名称已存在")
    org = Organization(**data.model_dump())
    session.add(org)
    await session.flush()
    await session.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: int, session: AsyncSession = Depends(get_db)):
    org = await session.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="组织未找到")
    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int, data: OrganizationUpdate, session: AsyncSession = Depends(get_db)
):
    org = await session.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="组织未找到")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(org, key, val)
    await session.flush()
    await session.refresh(org)
    return org


@router.delete("/{org_id}", response_model=MessageResponse)
async def delete_organization(org_id: int, session: AsyncSession = Depends(get_db)):
    org = await session.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="组织未找到")
    await session.delete(org)
    return MessageResponse(message="组织已删除")
