"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Calculator,
  Download,
  FileSpreadsheet,
  Pencil,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { annualApi, orgApi } from "@/lib/api"
import { GROUP_ORDER, getGradeColor, type AnnualEval, type Organization } from "@/lib/types"

const CURRENT_YEAR = new Date().getFullYear()

export default function AnnualPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [evals, setEvals] = useState<AnnualEval[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEval, setEditingEval] = useState<AnnualEval | null>(null)
  const [form, setForm] = useState({ annual_work_score: "100", annual_work_deduction_reason: "", satisfaction_score: "100", admin_grade: "" })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [o, e] = await Promise.all([
        orgApi.list(),
        annualApi.list({ year }),
      ])
      setOrgs(o)
      setEvals(e)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { loadData() }, [loadData])

  const orgMap = new Map(orgs.map((o) => [o.id, o]))
  const evalMap = new Map(evals.map((e) => [e.org_id, e]))

  const groupedOrgs = GROUP_ORDER.map((g) => ({
    group: g,
    orgs: orgs.filter((o) => o.group === g),
  }))

  const openEdit = (ev: AnnualEval) => {
    setEditingEval(ev)
    setForm({
      annual_work_score: String(ev.annual_work_score),
      annual_work_deduction_reason: ev.annual_work_deduction_reason || "",
      satisfaction_score: String(ev.satisfaction_score),
      admin_grade: ev.admin_grade || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingEval) return
    const payload = {
      annual_work_score: parseFloat(form.annual_work_score) || 0,
      annual_work_deduction_reason: form.annual_work_deduction_reason || null,
      satisfaction_score: parseFloat(form.satisfaction_score) || 0,
      admin_grade: form.admin_grade || null,
    }
    try {
      await annualApi.update(editingEval.id, payload)
      setDialogOpen(false)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "更新失败")
    }
  }

  const handleGenerate = async () => {
    if (!confirm(`基于${year}年四个季度数据生成年度评价？`)) return
    try {
      const result = await annualApi.generate(year)
      alert(`已生成 ${result.length} 条年度评价记录`)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "生成失败")
    }
  }

  const handleGrade = async () => {
    if (!confirm(`确定对 ${year}年度进行评级？`)) return
    try {
      const result = await annualApi.grade(year)
      alert(`年度评级完成！`)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "评级失败")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">年度评价</h1>
          <p className="text-muted-foreground">基于季度数据汇总生成年度评价结果</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" onClick={handleGenerate}>
            <FileSpreadsheet className="size-4" /> 从季度生成
          </Button>
          <Button variant="outline" onClick={handleGrade}>
            <Calculator className="size-4" /> 自动评级
          </Button>
          <a href={annualApi.exportExcel(year)} target="_blank" className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none h-7 gap-1 px-2 border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30">
            <Download className="size-4" /> 导出Excel
          </a>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              编辑年度评价 — {orgMap.get(editingEval?.org_id || 0)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingEval && (
              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <p>季度平均分：{editingEval.quarterly_avg.toFixed(2)}</p>
                <p>季度权重分(60%)：{editingEval.quarterly_weighted.toFixed(4)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>年度党建工作完成检查得分</Label>
              <Input type="number" value={form.annual_work_score} onChange={(e) => setForm({ ...form, annual_work_score: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>年度工作扣分说明</Label>
              <Input value={form.annual_work_deduction_reason} onChange={(e) => setForm({ ...form, annual_work_deduction_reason: e.target.value })} placeholder="可选" />
            </div>
            <div className="space-y-2">
              <Label>满意度测评综合得分</Label>
              <Input type="number" value={form.satisfaction_score} onChange={(e) => setForm({ ...form, satisfaction_score: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>行政绩效评价结果 (A/B/C)</Label>
              <Select value={form.admin_grade} onValueChange={(v) => setForm({ ...form, admin_grade: v || '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="手动输入" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingEval && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>年度工作权重分(30%)：{(parseFloat(form.annual_work_score) || 0) * 0.3}</p>
                <p>满意度权重分(10%)：{(parseFloat(form.satisfaction_score) || 0) * 0.1}</p>
                <p className="font-semibold">
                  年度总分：{(editingEval.quarterly_weighted + (parseFloat(form.annual_work_score) || 0) * 0.3 + (parseFloat(form.satisfaction_score) || 0) * 0.1).toFixed(4)}
                </p>
              </div>
            )}
            <Button onClick={handleSave} className="w-full">保存修改</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="space-y-6">
          {groupedOrgs.map(({ group, orgs: groupOrgs }) => {
            const groupEvals = groupOrgs.map((o) => ({ org: o, eval: evalMap.get(o.id) }))
            const hasData = groupEvals.some((item) => item.eval)
            if (!hasData && groupOrgs.length === 0) return null
            return (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{group} ({groupEvals.filter(e => e.eval).length}/{groupOrgs.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground text-xs">
                          <th className="px-3 py-2 font-medium">组织名称</th>
                          <th className="px-3 py-2 font-medium">Q1</th>
                          <th className="px-3 py-2 font-medium">Q2</th>
                          <th className="px-3 py-2 font-medium">Q3</th>
                          <th className="px-3 py-2 font-medium">Q4</th>
                          <th className="px-3 py-2 font-medium">季度均分</th>
                          <th className="px-3 py-2 font-medium">×60%</th>
                          <th className="px-3 py-2 font-medium">年度工作</th>
                          <th className="px-3 py-2 font-medium">满意度</th>
                          <th className="px-3 py-2 font-medium">总分</th>
                          <th className="px-3 py-2 font-medium">党群</th>
                          <th className="px-3 py-2 font-medium">行政</th>
                          <th className="px-3 py-2 font-medium">结果</th>
                          <th className="px-3 py-2 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupEvals.map(({ org, eval: ev }) => (
                          <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-3 py-2">{org.name}</td>
                            {ev ? (
                              <>
                                <td className="px-3 py-2">{ev.q1_total_score.toFixed(1)}</td>
                                <td className="px-3 py-2">{ev.q2_total_score.toFixed(1)}</td>
                                <td className="px-3 py-2">{ev.q3_total_score.toFixed(1)}</td>
                                <td className="px-3 py-2">{ev.q4_total_score.toFixed(1)}</td>
                                <td className="px-3 py-2 font-medium">{ev.quarterly_avg.toFixed(2)}</td>
                                <td className="px-3 py-2">{ev.quarterly_weighted.toFixed(2)}</td>
                                <td className="px-3 py-2">{ev.annual_work_score.toFixed(1)}</td>
                                <td className="px-3 py-2">{ev.satisfaction_score.toFixed(1)}</td>
                                <td className="px-3 py-2 font-medium">{ev.total_score.toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  {ev.party_mass_grade ? (
                                    <Badge className={getGradeColor(ev.party_mass_grade)}>{ev.party_mass_grade}</Badge>
                                  ) : "-"}
                                </td>
                                <td className="px-3 py-2">{ev.admin_grade || "-"}</td>
                                <td className="px-3 py-2">
                                  {ev.final_grade ? (
                                    <Badge className={getGradeColor(ev.final_grade)}>{ev.final_grade}</Badge>
                                  ) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(ev)}>
                                    <Pencil className="size-3" />
                                  </Button>
                                </td>
                              </>
                            ) : (
                              <td colSpan={13} className="px-3 py-2 text-muted-foreground text-xs">
                                请先点击"从季度生成"
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
