"""SQLAlchemy ORM models for the evaluation system."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, comment="党组织名称")
    group: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="分组：党委组/党总支组/党支部组/境外党组织组"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    quarterly_evals = relationship("QuarterlyEvaluation", back_populates="organization")
    annual_evals = relationship("AnnualEvaluation", back_populates="organization")


class QuarterlyEvaluation(Base):
    """季度创先争优评价结果"""

    __tablename__ = "quarterly_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    org_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    quarter: Mapped[int] = mapped_column(Integer, nullable=False, comment="季度 1-4")

    # "七大动力"评价
    score_7powers_base: Mapped[float] = mapped_column(
        Float, default=80.0, comment="'七大动力'检查得分（满分80）"
    )
    deduction_7powers: Mapped[float] = mapped_column(
        Float, default=0.0, comment="'七大动力'扣分"
    )
    deduction_reason_7powers: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="'七大动力'扣分说明"
    )

    # 季度党群重点工作评价
    score_key_work_base: Mapped[float] = mapped_column(
        Float, default=20.0, comment="季度党群重点工作检查得分（满分20）"
    )
    deduction_key_work: Mapped[float] = mapped_column(
        Float, default=0.0, comment="季度党群重点工作扣分"
    )
    deduction_reason_key_work: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="季度党群重点工作扣分说明"
    )

    # 8项贡献度加分
    score_commend: Mapped[float] = mapped_column(
        Float, default=0.0, comment="获得公司及以上党组织表彰奖励加分"
    )
    score_topic: Mapped[float] = mapped_column(
        Float, default=0.0, comment="承担公司及以上党组织重点课题/专项任务加分"
    )
    score_exchange: Mapped[float] = mapped_column(
        Float, default=0.0, comment="代表公司做党建经验交流发言加分"
    )
    score_brand: Mapped[float] = mapped_column(
        Float, default=0.0, comment="围绕'动力'党建品牌建设加分"
    )
    score_media: Mapped[float] = mapped_column(
        Float, default=0.0, comment="新闻宣传/企业文化传播加分"
    )
    score_inspect: Mapped[float] = mapped_column(
        Float, default=0.0, comment="支持党委巡察工作和纪委工作加分"
    )
    score_union: Mapped[float] = mapped_column(
        Float, default=0.0, comment="基层工会季度贡献度评价加分"
    )
    score_youth: Mapped[float] = mapped_column(
        Float, default=0.0, comment="基层团组织贡献度评价加分"
    )

    # 计算结果
    contribution_total: Mapped[float] = mapped_column(
        Float, default=0.0, comment="季度党群贡献度评价得分（8项合计）"
    )
    total_score: Mapped[float] = mapped_column(
        Float, default=0.0, comment="党群绩效得分 = 七大动力 + 重点工作 + 贡献度"
    )
    party_mass_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="党群绩效评价结果 (A/B/C)"
    )
    admin_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="行政绩效结果 (A/B/C) — 手动输入"
    )
    final_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="创先争优结果 (A/B/C)"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    organization = relationship("Organization", back_populates="quarterly_evals")


class AnnualEvaluation(Base):
    """年度基层党组织创先争优评价结果"""

    __tablename__ = "annual_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    org_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("organizations.id"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")

    # 四个季度得分（从季度评价自动获取）
    q1_total_score: Mapped[float] = mapped_column(Float, default=0.0)
    q2_total_score: Mapped[float] = mapped_column(Float, default=0.0)
    q3_total_score: Mapped[float] = mapped_column(Float, default=0.0)
    q4_total_score: Mapped[float] = mapped_column(Float, default=0.0)
    quarterly_avg: Mapped[float] = mapped_column(Float, default=0.0, comment="季度平均分")
    quarterly_weighted: Mapped[float] = mapped_column(
        Float, default=0.0, comment="季度权重分（60%）"
    )

    # 年度党建工作完成结果
    annual_work_score: Mapped[float] = mapped_column(
        Float, default=0.0, comment="年度党建工作完成检查得分"
    )
    annual_work_weighted: Mapped[float] = mapped_column(
        Float, default=0.0, comment="年度工作权重分（30%）"
    )
    annual_work_deduction_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="年度工作扣分说明"
    )

    # 满意度测评
    satisfaction_score: Mapped[float] = mapped_column(
        Float, default=0.0, comment="年度党建工作满意度测评综合得分"
    )
    satisfaction_weighted: Mapped[float] = mapped_column(
        Float, default=0.0, comment="满意度权重分（10%）"
    )

    # 结果
    total_score: Mapped[float] = mapped_column(
        Float, default=0.0, comment="年度党群绩效得分"
    )
    party_mass_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="党群绩效评价结果 (A/B/C)"
    )
    admin_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="行政绩效评价结果 (A/B/C) — 手动输入"
    )
    final_grade: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="创先争优结果 (A/B/C)"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    organization = relationship("Organization", back_populates="annual_evals")


class EvaluationRule(Base):
    """评价规则配置"""

    __tablename__ = "evaluation_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="分组名称"
    )
    grade_a_ratio: Mapped[float] = mapped_column(
        Float, default=0.4, comment="A等级比例"
    )
    grade_b_ratio: Mapped[float] = mapped_column(
        Float, default=0.4, comment="B等级比例"
    )
    grade_c_ratio: Mapped[float] = mapped_column(
        Float, default=0.2, comment="C等级比例"
    )
    matrix_data: Mapped[str] = mapped_column(
        Text, default='{"A_A":"A","A_B":"A","A_C":"B","B_A":"A","B_B":"B","B_C":"C","C_A":"B","C_B":"C","C_C":"C"}',
        comment="创先争优交叉矩阵 (JSON)",
    )
    quarter_weight: Mapped[float] = mapped_column(
        Float, default=0.6, comment="季度绩效权重"
    )
    annual_work_weight: Mapped[float] = mapped_column(
        Float, default=0.3, comment="年度工作权重"
    )
    satisfaction_weight: Mapped[float] = mapped_column(
        Float, default=0.1, comment="满意度权重"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
