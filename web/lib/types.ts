/** TypeScript types matching the backend schemas */

export interface Organization {
  id: number
  name: string
  group: string
  created_at: string | null
  updated_at: string | null
}

export interface OrganizationCreate {
  name: string
  group: string
}

export interface OrganizationUpdate {
  name?: string
  group?: string
}

export interface QuarterlyEval {
  id: number
  org_id: number
  year: number
  quarter: number
  score_7powers_base: number
  deduction_7powers: number
  deduction_reason_7powers: string | null
  score_key_work_base: number
  deduction_key_work: number
  deduction_reason_key_work: string | null
  score_commend: number
  score_topic: number
  score_exchange: number
  score_brand: number
  score_media: number
  score_inspect: number
  score_union: number
  score_youth: number
  contribution_total: number
  total_score: number
  party_mass_grade: string | null
  admin_grade: string | null
  final_grade: string | null
  created_at: string | null
  updated_at: string | null
}

export interface QuarterlyEvalCreate {
  org_id: number
  year: number
  quarter: number
  score_7powers_base?: number
  deduction_7powers?: number
  deduction_reason_7powers?: string | null
  score_key_work_base?: number
  deduction_key_work?: number
  deduction_reason_key_work?: string | null
  score_commend?: number
  score_topic?: number
  score_exchange?: number
  score_brand?: number
  score_media?: number
  score_inspect?: number
  score_union?: number
  score_youth?: number
  admin_grade?: string | null
}

export interface AnnualEval {
  id: number
  org_id: number
  year: number
  q1_total_score: number
  q2_total_score: number
  q3_total_score: number
  q4_total_score: number
  quarterly_avg: number
  quarterly_weighted: number
  annual_work_score: number
  annual_work_weighted: number
  annual_work_deduction_reason: string | null
  satisfaction_score: number
  satisfaction_weighted: number
  total_score: number
  party_mass_grade: string | null
  admin_grade: string | null
  final_grade: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AnnualEvalCreate {
  org_id: number
  year: number
  annual_work_score?: number
  annual_work_deduction_reason?: string | null
  satisfaction_score?: number
  admin_grade?: string | null
}

export interface AnnualEvalUpdate {
  annual_work_score?: number
  annual_work_deduction_reason?: string | null
  satisfaction_score?: number
  admin_grade?: string | null
}

export interface EvalRule {
  id: number
  group_name: string
  grade_a_ratio: number
  grade_b_ratio: number
  grade_c_ratio: number
  matrix_data: string
  quarter_weight: number
  annual_work_weight: number
  satisfaction_weight: number
}

export interface GradeResult {
  message: string
  summary: Record<string, Array<{
    id: number
    org_id: number
    total_score: number
    party_mass_grade: string
    admin_grade: string | null
    final_grade: string | null
  }>>
}

// Helper: group display order
export const GROUP_ORDER = ["党委组", "党总支组", "党支部组", "境外党组织组"]

export function getGradeColor(grade: string | null): string {
  if (!grade) return "bg-gray-100 text-gray-700"
  switch (grade) {
    case "A": return "bg-green-100 text-green-800 border-green-300"
    case "B": return "bg-blue-100 text-blue-800 border-blue-300"
    case "C": return "bg-yellow-100 text-yellow-800 border-yellow-300"
    default: return "bg-gray-100 text-gray-700"
  }
}
