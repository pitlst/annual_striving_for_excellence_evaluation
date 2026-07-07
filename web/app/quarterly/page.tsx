"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BarChart3,
  Calculator,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
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
import { orgApi, quarterlyApi } from "@/lib/api"
import { GROUP_ORDER, getGradeColor, type Organization, type QuarterlyEval } from "@/lib/types"

const QUARTERS = [
  { value: 1, label: "第一季度" },
  { value: 2, label: "第二季度" },
  { value: 3, label: "第三季度" },
  { value: 4, label: "第四季度" },
]

const CURRENT_YEAR = new Date().getFullYear()

export default function QuarterlyPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [quarter, setQuarter] = useState(1)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [evals, setEvals] = useState<QuarterlyEval[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEval, setEditingEval] = useState<QuarterlyEval | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)

  // Form state
  const [form, setForm] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [o, e] = await Promise.all([
        orgApi.list(),
        quarterlyApi.list({ year, quarter }),
      ])
      setOrgs(o)
      setEvals(e)
    } finally {
      setLoading(false)
    }
  }, [year, quarter])

  useEffect(() => { loadData() }, [loadData])

  const orgMap = new Map(orgs.map((o) => [o.id, o]))
  const evalMap = new Map(evals.map((e) => [e.org_id, e]))

  const groupedOrgs = GROUP_ORDER.map((g) => ({
    group: g,
    orgs: orgs.filter((o) => o.group === g),
  }))

  const resetForm = () => {
    setEditingEval(null)
    setSelectedOrgId(null)
    setForm({
      score_7powers_base: "80",
      deduction_7powers: "0",
      deduction_reason_7powers: "",
      score_key_work_base: "20",
      deduction_key_work: "0",
      deduction_reason_key_work: "",
      score_commend: "0",
      score_topic: "0",
      score_exchange: "0",
      score_brand: "0",
      score_media: "0",
      score_inspect: "0",
      score_union: "0",
      score_youth: "0",
      admin_grade: "",
    })
  }

  const openCreate = (orgId: number) => {
    resetForm()
    setSelectedOrgId(orgId)
    setDialogOpen(true)
  }

  const openEdit = (ev: QuarterlyEval) => {
    setEditingEval(ev)
    setSelectedOrgId(ev.org_id)
    setForm({
      score_7powers_base: String(ev.score_7powers_base),
      deduction_7powers: String(ev.deduction_7powers),
      deduction_reason_7powers: ev.deduction_reason_7powers || "",
      score_key_work_base: String(ev.score_key_work_base),
      deduction_key_work: String(ev.deduction_key_work),
      deduction_reason_key_work: ev.deduction_reason_key_work || "",
      score_commend: String(ev.score_commend),
      score_topic: String(ev.score_topic),
      score_exchange: String(ev.score_exchange),
      score_brand: String(ev.score_brand),
      score_media: String(ev.score_media),
      score_inspect: String(ev.score_inspect),
      score_union: String(ev.score_union),
      score_youth: String(ev.score_youth),
      admin_grade: ev.admin_grade || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedOrgId) return
    const num = (v: string) => parseFloat(v) || 0
    const payload = {
      org_id: selectedOrgId,
      year,
      quarter,
      score_7powers_base: num(form.score_7powers_base),
      deduction_7powers: num(form.deduction_7powers),
      deduction_reason_7powers: form.deduction_reason_7powers || null,
      score_key_work_base: num(form.score_key_work_base),
      deduction_key_work: num(form.deduction_key_work),
      deduction_reason_key_work: form.deduction_reason_key_work || null,
      score_commend: num(form.score_commend),
      score_topic: num(form.score_topic),
      score_exchange: num(form.score_exchange),
      score_brand: num(form.score_brand),
      score_media: num(form.score_media),
      score_inspect: num(form.score_inspect),
      score_union: num(form.score_union),
      score_youth: num(form.score_youth),
      admin_grade: form.admin_grade || null,
    }
    try {
      if (editingEval) {
        await quarterlyApi.update(editingEval.id, payload)
      } else {
        await quarterlyApi.create(payload)
      }
      setDialogOpen(false)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "操作失败")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条评价记录？")) return
    try {
      await quarterlyApi.delete(id)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "删除失败")
    }
  }

  const handleGrade = async () => {
    if (!confirm(`确定对 ${year}年第${quarter}季度进行评级？\n系统将根据各分组排名自动分配 A/B/C 等级。`)) return
    try {
      const result = await quarterlyApi.grade(year, quarter)
      alert(`评级完成！\n${Object.entries(result.summary).map(([g, items]) => `${g}: ${items.length}个`).join("\n")}`)
      await loadData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "评级失败")
    }
  }

  // Calculate derived values for preview
  const score7p = parseFloat(form.score_7powers_base) - parseFloat(form.deduction_7powers)
  const scoreKw = parseFloat(form.score_key_work_base) - parseFloat(form.deduction_key_work)
  const contribution =
    ["commend", "topic", "exchange", "brand", "media", "inspect", "union", "youth"]
      .reduce((sum, k) => sum + (parseFloat(form[`score_${k}`]) || 0), 0)
  const totalScore = score7p + scoreKw + contribution

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">季度评价</h1>
          <p className="text-muted-foreground">录入各组织季度创先争优评分数据</p>
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
          <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" onClick={handleGrade}>
            <Calculator className="size-4" /> 自动评级
          </Button>
          <a href={quarterlyApi.exportExcel(year, quarter)} target="_blank" className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none h-7 gap-1 px-2 border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30">
            <Download className="size-4" /> 导出Excel
          </a>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEval ? "编辑评价" : "新增评价"} — {orgMap.get(selectedOrgId || 0)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>"七大动力"检查得分<span className="text-xs text-muted-foreground">(满分80)</span></Label>
                <Input type="number" value={form.score_7powers_base} onChange={(e) => setForm({ ...form, score_7powers_base: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>"七大动力"扣分</Label>
                <Input type="number" value={form.deduction_7powers} onChange={(e) => setForm({ ...form, deduction_7powers: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>"七大动力"扣分说明</Label>
              <Input value={form.deduction_reason_7powers} onChange={(e) => setForm({ ...form, deduction_reason_7powers: e.target.value })} placeholder="可选" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>党群重点工作检查得分<span className="text-xs text-muted-foreground">(满分20)</span></Label>
                <Input type="number" value={form.score_key_work_base} onChange={(e) => setForm({ ...form, score_key_work_base: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>党群重点工作扣分</Label>
                <Input type="number" value={form.deduction_key_work} onChange={(e) => setForm({ ...form, deduction_key_work: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>党群重点工作扣分说明</Label>
              <Input value={form.deduction_reason_key_work} onChange={(e) => setForm({ ...form, deduction_reason_key_work: e.target.value })} placeholder="可选" />
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">党群贡献度加分项</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "score_commend", label: "表彰奖励" },
                  { key: "score_topic", label: "重点课题/专项任务" },
                  { key: "score_exchange", label: "党建经验交流发言" },
                  { key: "score_brand", label: "动力党建品牌建设" },
                  { key: "score_media", label: "新闻宣传/企业文化" },
                  { key: "score_inspect", label: "党委巡察/纪委工作" },
                  { key: "score_union", label: "工会贡献度" },
                  { key: "score_youth", label: "团组织贡献度" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.01" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>行政绩效结果 (A/B/C)</Label>
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
            </div>
            {/* Score Preview */}
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>七大动力得分：{score7p.toFixed(2)}</p>
              <p>重点工作得分：{scoreKw.toFixed(2)}</p>
              <p>贡献度合计：{contribution.toFixed(2)}</p>
              <p className="font-semibold text-base">党群绩效总分：{totalScore.toFixed(2)}</p>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingEval ? "保存修改" : "创建评价"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evaluation table by group */}
      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="space-y-6">
          {groupedOrgs.map(({ group, orgs: groupOrgs }) => {
            const hasData = groupOrgs.some((o) => evalMap.has(o.id))
            if (!hasData && groupOrgs.length === 0) return null
            return (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{group}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground text-xs">
                          <th className="px-3 py-2 font-medium">组织名称</th>
                          <th className="px-3 py-2 font-medium">七大动力</th>
                          <th className="px-3 py-2 font-medium">重点工作</th>
                          <th className="px-3 py-2 font-medium">贡献度</th>
                          <th className="px-3 py-2 font-medium">总分</th>
                          <th className="px-3 py-2 font-medium">党群绩效</th>
                          <th className="px-3 py-2 font-medium">行政绩效</th>
                          <th className="px-3 py-2 font-medium">创先争优</th>
                          <th className="px-3 py-2 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupOrgs.map((org) => {
                          const ev = evalMap.get(org.id)
                          return (
                            <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-3 py-2">{org.name}</td>
                              {ev ? (
                                <>
                                  <td className="px-3 py-2">{(ev.score_7powers_base - ev.deduction_7powers).toFixed(1)}</td>
                                  <td className="px-3 py-2">{(ev.score_key_work_base - ev.deduction_key_work).toFixed(1)}</td>
                                  <td className="px-3 py-2">{ev.contribution_total.toFixed(1)}</td>
                                  <td className="px-3 py-2 font-medium">{ev.total_score.toFixed(1)}</td>
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
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(ev)}>
                                        <Pencil className="size-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(ev.id)}>
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <td colSpan={8} className="px-3 py-2">
                                  <Button variant="ghost" size="xs" onClick={() => openCreate(org.id)}>
                                    <Plus className="size-3" /> 录入
                                  </Button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
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
