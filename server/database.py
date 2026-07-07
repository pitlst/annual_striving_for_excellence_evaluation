"""Database configuration and session management."""

import asyncio
import json
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DB_PATH = Path(__file__).parent / "data" / "evaluation.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables."""
    from models.models import (  # noqa: F401 — ensure models are registered
        AnnualEvaluation,
        EvaluationRule,
        Organization,
        QuarterlyEvaluation,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_db() -> None:
    """Seed initial data if empty."""
    from models.models import Organization, EvaluationRule

    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(Organization.__table__.select().limit(1))
        if result.first():
            return

        # --- Seed organizations ---
        org_data: list[dict] = [
            {"group": "党委组", "name": "转向架制造中心党委"},
            {"group": "党委组", "name": "车体制造中心党委"},
            {"group": "党委组", "name": "城轨制造中心党委"},
            {"group": "党委组", "name": "客户服务中心党委"},
            {"group": "党委组", "name": "装备工程部党委"},
            {"group": "党委组", "name": "产品研发中心党委"},
            {"group": "党委组", "name": "机车制造中心党委"},
            {"group": "党委组", "name": "电气设备分公司党委"},
            {"group": "党委组", "name": "河南中车重型装备有限公司党委"},
            {"group": "党委组", "name": "供应链管理部党委"},
            {"group": "党委组", "name": "物流部党委"},
            {"group": "党总支组", "name": "重载快捷大功率电力机车全国重点实验室党总支"},
            {"group": "党总支组", "name": "昆明中车轨道交通装备有限公司党总支"},
            {"group": "党总支组", "name": "后勤保障部党总支"},
            {"group": "党总支组", "name": "国际业务事业部党总支"},
            {"group": "党总支组", "name": "安全环保部党总支"},
            {"group": "党总支组", "name": "上海中车申通轨道交通车辆有限公司党总支"},
            {"group": "党总支组", "name": "项目管理中心党总支"},
            {"group": "党总支组", "name": "铁路业务事业部党总支"},
            {"group": "党总支组", "name": "城市交通事业部党总支"},
            {"group": "党总支组", "name": "维保事业部党总支"},
            {"group": "党支部组", "name": "南宁中车铝材精密加工有限公司党支部"},
            {"group": "党支部组", "name": "工艺部党支部"},
            {"group": "党支部组", "name": "宁波中车轨道交通装备有限公司党支部"},
            {"group": "党支部组", "name": "运营管理部党支部"},
            {"group": "党支部组", "name": "株洲国创科技有限公司党支部"},
            {"group": "党支部组", "name": "知识管理与标准化部党支部"},
            {"group": "党支部组", "name": "沧州中车株机轨道装备服务有限公司党支部"},
            {"group": "党支部组", "name": "审计风险与法律合规党支部"},
            {"group": "党支部组", "name": "数字化部党支部"},
            {"group": "党支部组", "name": "人力资源部党支部"},
            {"group": "党支部组", "name": "质量保证部党支部"},
            {"group": "党支部组", "name": "南宁中车轨道交通装备有限公司党支部"},
            {"group": "党支部组", "name": "湖南智融科技有限公司党支部"},
            {"group": "党支部组", "name": "武汉中车株机轨道交通装备有限公司党支部"},
            {"group": "党支部组", "name": "系统工程部党支部"},
            {"group": "党支部组", "name": "科技管理部党支部"},
            {"group": "党支部组", "name": "财务部党支部"},
            {"group": "党支部组", "name": "规划发展部党支部"},
            {"group": "党支部组", "name": "乌鲁木齐中车轨道交通装备有限公司党支部"},
            {"group": "党支部组", "name": "绿能科技分公司党支部"},
            {"group": "党支部组", "name": "宁波市江北九方和荣电气有限公司党支部"},
            {"group": "党支部组", "name": "洛阳中车轨道交通装备有限公司党支部"},
            {"group": "党支部组", "name": "株洲中车物流有限公司党支部"},
            {"group": "党支部组", "name": "宁波中车智维科技有限公司党支部"},
            {"group": "党支部组", "name": "战新产业事业部党支部"},
            {"group": "党支部组", "name": "纪检巡察党支部"},
            {"group": "党支部组", "name": "总部机关党支部"},
            {"group": "党支部组", "name": "群团机关党支部"},
            {"group": "党支部组", "name": "党委宣传部（企业文化与品牌管理部）党支部"},
        ]

        for item in org_data:
            org = Organization(**item)
            session.add(org)

        # --- Seed evaluation rules ---
        groups = ["党委组", "党总支组", "党支部组", "境外党组织组"]
        for g in groups:
            rule = EvaluationRule(
                group_name=g,
                grade_a_ratio=0.4,
                grade_b_ratio=0.4,
                grade_c_ratio=0.2,
                # Cross-reference matrix: party_mass_grade × admin_grade → final_grade
                matrix_data=json.dumps({
                    "A_A": "A",
                    "A_B": "A",
                    "A_C": "B",
                    "B_A": "A",
                    "B_B": "B",
                    "B_C": "C",
                    "C_A": "B",
                    "C_B": "C",
                    "C_C": "C",
                }),
                quarter_weight=0.6,
                annual_work_weight=0.3,
                satisfaction_weight=0.1,
            )
            session.add(rule)

        await session.commit()
