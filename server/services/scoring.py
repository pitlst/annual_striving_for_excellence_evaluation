"""Scoring engine — computes all evaluation scores."""

from models.models import QuarterlyEvaluation, AnnualEvaluation


def calculate_quarterly_scores(eval_obj: QuarterlyEvaluation) -> None:
    """Compute derived scores for a quarterly evaluation (mutates in-place)."""
    # 七大动力得分 = base - deduction
    score_7powers = eval_obj.score_7powers_base - eval_obj.deduction_7powers

    # 季度党群重点工作得分 = base - deduction
    score_key_work = eval_obj.score_key_work_base - eval_obj.deduction_key_work

    # 贡献度合计 = sum of 8 items
    eval_obj.contribution_total = (
        eval_obj.score_commend
        + eval_obj.score_topic
        + eval_obj.score_exchange
        + eval_obj.score_brand
        + eval_obj.score_media
        + eval_obj.score_inspect
        + eval_obj.score_union
        + eval_obj.score_youth
    )

    # 党群绩效总分
    eval_obj.total_score = score_7powers + score_key_work + eval_obj.contribution_total


def calculate_annual_scores(eval_obj: AnnualEvaluation) -> None:
    """Compute derived scores for an annual evaluation (mutates in-place)."""
    # 季度平均分
    q_scores = [
        eval_obj.q1_total_score,
        eval_obj.q2_total_score,
        eval_obj.q3_total_score,
        eval_obj.q4_total_score,
    ]
    filled = [s for s in q_scores if s > 0]
    eval_obj.quarterly_avg = sum(filled) / len(filled) if filled else 0.0

    # 季度权重分 60%
    eval_obj.quarterly_weighted = eval_obj.quarterly_avg * 0.6

    # 年度工作权重分 30%
    eval_obj.annual_work_weighted = eval_obj.annual_work_score * 0.3

    # 满意度权重分 10%
    eval_obj.satisfaction_weighted = eval_obj.satisfaction_score * 0.1

    # 总分
    eval_obj.total_score = (
        eval_obj.quarterly_weighted
        + eval_obj.annual_work_weighted
        + eval_obj.satisfaction_weighted
    )
