/** API client for the backend services */

import type {
  AnnualEval,
  AnnualEvalCreate,
  AnnualEvalUpdate,
  EvalRule,
  GradeResult,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  QuarterlyEval,
  QuarterlyEvalCreate,
} from "./types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765/api"

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }
  const res = await fetch(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`API ${method} ${path}: ${res.status} — ${msg}`)
  }
  return res.json()
}

// ─── Organizations ────────────────────────────────────
export const orgApi = {
  list: () => request<Organization[]>("GET", "/organizations"),
  get: (id: number) => request<Organization>("GET", `/organizations/${id}`),
  create: (data: OrganizationCreate) =>
    request<Organization>("POST", "/organizations", data),
  update: (id: number, data: OrganizationUpdate) =>
    request<Organization>("PUT", `/organizations/${id}`, data),
  delete: (id: number) =>
    request<{ message: string }>("DELETE", `/organizations/${id}`),
}

// ─── Quarterly Evaluations ────────────────────────────
export const quarterlyApi = {
  list: (params?: { year?: number; quarter?: number; org_id?: number }) =>
    request<QuarterlyEval[]>("GET", "/quarterly-evals", undefined, params as Record<string, string | number>),
  get: (id: number) => request<QuarterlyEval>("GET", `/quarterly-evals/${id}`),
  create: (data: QuarterlyEvalCreate) =>
    request<QuarterlyEval>("POST", "/quarterly-evals", data),
  update: (id: number, data: Partial<QuarterlyEvalCreate>) =>
    request<QuarterlyEval>("PUT", `/quarterly-evals/${id}`, data),
  delete: (id: number) =>
    request<{ message: string }>("DELETE", `/quarterly-evals/${id}`),
  grade: (year: number, quarter: number) =>
    request<GradeResult>("POST", "/quarterly-evals/grade", undefined, { year, quarter }),
  exportExcel: (year: number, quarter: number): string =>
    `${BASE_URL}/quarterly-evals/export/excel?year=${year}&quarter=${quarter}`,
}

// ─── Annual Evaluations ───────────────────────────────
export const annualApi = {
  list: (params?: { year?: number; org_id?: number }) =>
    request<AnnualEval[]>("GET", "/annual-evals", undefined, params as Record<string, string | number>),
  get: (id: number) => request<AnnualEval>("GET", `/annual-evals/${id}`),
  create: (data: AnnualEvalCreate) =>
    request<AnnualEval>("POST", "/annual-evals", data),
  update: (id: number, data: AnnualEvalUpdate) =>
    request<AnnualEval>("PUT", `/annual-evals/${id}`, data),
  delete: (id: number) =>
    request<{ message: string }>("DELETE", `/annual-evals/${id}`),
  generate: (year: number) =>
    request<AnnualEval[]>("POST", "/annual-evals/generate", undefined, { year }),
  grade: (year: number) =>
    request<GradeResult>("POST", "/annual-evals/grade", undefined, { year }),
  exportExcel: (year: number): string =>
    `${BASE_URL}/annual-evals/export/excel?year=${year}`,
}

// ─── Eval Rules ───────────────────────────────────────
export const ruleApi = {
  list: () => request<EvalRule[]>("GET", "/eval-rules"),
  get: (groupName: string) => request<EvalRule>("GET", `/eval-rules/${encodeURIComponent(groupName)}`),
  update: (groupName: string, data: Partial<EvalRule>) =>
    request<EvalRule>("PUT", `/eval-rules/${encodeURIComponent(groupName)}`, data),
}
