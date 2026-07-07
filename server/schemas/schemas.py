"""Pydantic schemas for API request/response validation."""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Organization ────────────────────────────────────────────────
class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=200, description="党组织名称")
    group: str = Field(..., max_length=50, description="分组")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    group: str | None = Field(None, max_length=50)


class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# ─── Quarterly Evaluation ────────────────────────────────────────
class QuarterlyEvalBase(BaseModel):
    org_id: int
    year: int = Field(..., ge=2000, le=2100)
    quarter: int = Field(..., ge=1, le=4)

    score_7powers_base: float = Field(default=80.0, ge=0, le=80)
    deduction_7powers: float = Field(default=0.0, ge=0)
    deduction_reason_7powers: str | None = None

    score_key_work_base: float = Field(default=20.0, ge=0, le=20)
    deduction_key_work: float = Field(default=0.0, ge=0)
    deduction_reason_key_work: str | None = None

    score_commend: float = Field(default=0.0, ge=0)
    score_topic: float = Field(default=0.0, ge=0)
    score_exchange: float = Field(default=0.0, ge=0)
    score_brand: float = Field(default=0.0, ge=0)
    score_media: float = Field(default=0.0, ge=0)
    score_inspect: float = Field(default=0.0, ge=0)
    score_union: float = Field(default=0.0, ge=0)
    score_youth: float = Field(default=0.0, ge=0)

    admin_grade: str | None = Field(None, max_length=10, description="行政绩效结果 (A/B/C)")


class QuarterlyEvalCreate(QuarterlyEvalBase):
    pass


class QuarterlyEvalUpdate(BaseModel):
    score_7powers_base: float | None = Field(None, ge=0, le=80)
    deduction_7powers: float | None = Field(None, ge=0)
    deduction_reason_7powers: str | None = None
    score_key_work_base: float | None = Field(None, ge=0, le=20)
    deduction_key_work: float | None = Field(None, ge=0)
    deduction_reason_key_work: str | None = None
    score_commend: float | None = Field(None, ge=0)
    score_topic: float | None = Field(None, ge=0)
    score_exchange: float | None = Field(None, ge=0)
    score_brand: float | None = Field(None, ge=0)
    score_media: float | None = Field(None, ge=0)
    score_inspect: float | None = Field(None, ge=0)
    score_union: float | None = Field(None, ge=0)
    score_youth: float | None = Field(None, ge=0)
    admin_grade: str | None = Field(None, max_length=10)


class QuarterlyEvalResponse(QuarterlyEvalBase):
    id: int
    contribution_total: float
    total_score: float
    party_mass_grade: str | None
    final_grade: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# ─── Annual Evaluation ───────────────────────────────────────────
class AnnualEvalBase(BaseModel):
    org_id: int
    year: int = Field(..., ge=2000, le=2100)

    annual_work_score: float = Field(default=0.0, ge=0, description="年度党建工作完成检查得分")
    annual_work_deduction_reason: str | None = None
    satisfaction_score: float = Field(default=0.0, ge=0, description="满意度测评综合得分")
    admin_grade: str | None = Field(None, max_length=10, description="行政绩效评价结果 (A/B/C)")


class AnnualEvalCreate(AnnualEvalBase):
    pass


class AnnualEvalUpdate(BaseModel):
    annual_work_score: float | None = Field(None, ge=0)
    annual_work_deduction_reason: str | None = None
    satisfaction_score: float | None = Field(None, ge=0)
    admin_grade: str | None = Field(None, max_length=10)


class AnnualEvalResponse(AnnualEvalBase):
    id: int
    q1_total_score: float
    q2_total_score: float
    q3_total_score: float
    q4_total_score: float
    quarterly_avg: float
    quarterly_weighted: float
    annual_work_weighted: float
    satisfaction_weighted: float
    total_score: float
    party_mass_grade: str | None
    final_grade: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# ─── Evaluation Rule ─────────────────────────────────────────────
class EvalRuleResponse(BaseModel):
    id: int
    group_name: str
    grade_a_ratio: float
    grade_b_ratio: float
    grade_c_ratio: float
    matrix_data: str
    quarter_weight: float
    annual_work_weight: float
    satisfaction_weight: float

    model_config = {"from_attributes": True}


class EvalRuleUpdate(BaseModel):
    grade_a_ratio: float | None = None
    grade_b_ratio: float | None = None
    grade_c_ratio: float | None = None
    matrix_data: str | None = None
    quarter_weight: float | None = None
    annual_work_weight: float | None = None
    satisfaction_weight: float | None = None


# ─── Generic ─────────────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
