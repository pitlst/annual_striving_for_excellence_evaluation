"use client"

import { useCallback, useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ruleApi } from "@/lib/api"
import type { EvalRule } from "@/lib/types"

const MATRIX_LABELS: Record<string, string> = {
  A_A: "党群A × 行政A",
  A_B: "党群A × 行政B",
  A_C: "党群A × 行政C",
  B_A: "党群B × 行政A",
  B_B: "党群B × 行政B",
  B_C: "党群B × 行政C",
  C_A: "党群C × 行政A",
  C_B: "党群C × 行政B",
  C_C: "党群C × 行政C",
}

export default function SettingsPage() {
  const [rules, setRules] = useState<EvalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadRules = useCallback(async () => {
    try {
      const data = await ruleApi.list()
      setRules(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const updateRule = (idx: number, field: string, value: string) => {
    setRules((prev) => {
      const next = [...prev]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(next[idx] as any)[field] = value
      return next
    })
  }

  const updateMatrix = (idx: number, key: string, value: string) => {
    setRules((prev) => {
      const next = [...prev]
      const matrix = JSON.parse(next[idx].matrix_data)
      matrix[key] = value
      next[idx] = { ...next[idx], matrix_data: JSON.stringify(matrix) }
      return next
    })
  }

  const handleSave = async (rule: EvalRule) => {
    setSaving(true)
    try {
      await ruleApi.update(rule.group_name, {
        grade_a_ratio: Number(rule.grade_a_ratio),
        grade_b_ratio: Number(rule.grade_b_ratio),
        grade_c_ratio: Number(rule.grade_c_ratio),
        matrix_data: rule.matrix_data,
        quarter_weight: Number(rule.quarter_weight),
        annual_work_weight: Number(rule.annual_work_weight),
        satisfaction_weight: Number(rule.satisfaction_weight),
      })
      alert("保存成功")
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">加载中...</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">规则配置</h1>
        <p className="text-muted-foreground">管理各分组的评级参数和交叉矩阵</p>
      </div>

      {rules.map((rule, idx) => {
        const matrix = JSON.parse(rule.matrix_data)
        return (
          <Card key={rule.group_name}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {rule.group_name}
                <Button size="sm" onClick={() => handleSave(rule)} disabled={saving}>
                  <Save className="size-3" /> 保存
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grade ratios */}
              <div>
                <p className="text-sm font-medium mb-2">等级比例</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">A 级比例</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={String(rule.grade_a_ratio)}
                      onChange={(e) => updateRule(idx, "grade_a_ratio", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">B 级比例</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={String(rule.grade_b_ratio)}
                      onChange={(e) => updateRule(idx, "grade_b_ratio", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">C 级比例</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={String(rule.grade_c_ratio)}
                      onChange={(e) => updateRule(idx, "grade_c_ratio", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Weights */}
              <div>
                <p className="text-sm font-medium mb-2">年度权重</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">季度绩效权重</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={String(rule.quarter_weight)}
                      onChange={(e) => updateRule(idx, "quarter_weight", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">年度工作权重</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={String(rule.annual_work_weight)}
                      onChange={(e) => updateRule(idx, "annual_work_weight", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">满意度权重</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={String(rule.satisfaction_weight)}
                      onChange={(e) => updateRule(idx, "satisfaction_weight", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  合计：{(Number(rule.quarter_weight) + Number(rule.annual_work_weight) + Number(rule.satisfaction_weight)).toFixed(2)}
                  {Math.abs(Number(rule.quarter_weight) + Number(rule.annual_work_weight) + Number(rule.satisfaction_weight) - 1) > 0.01
                    ? " ⚠️ 合计应等于 1"
                    : " ✓"}
                </p>
              </div>

              {/* Cross-reference matrix */}
              <div>
                <p className="text-sm font-medium mb-2">创先争优交叉矩阵</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(MATRIX_LABELS).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        value={matrix[key] || "C"}
                        onChange={(e) => updateMatrix(idx, key, e.target.value)}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
