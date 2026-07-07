"use client"

import { useEffect, useState } from "react"
import { Building2, ClipboardCheck, FileSpreadsheet, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orgApi, quarterlyApi, annualApi } from "@/lib/api"
import type { Organization, QuarterlyEval, AnnualEval } from "@/lib/types"

export default function Dashboard() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [quarterlyEvals, setQuarterlyEvals] = useState<QuarterlyEval[]>([])
  const [annualEvals, setAnnualEvals] = useState<AnnualEval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      orgApi.list(),
      quarterlyApi.list({ year: new Date().getFullYear() }),
      annualApi.list({ year: new Date().getFullYear() }),
    ]).then(([o, q, a]) => {
      setOrgs(o)
      setQuarterlyEvals(q)
      setAnnualEvals(a)
    }).finally(() => setLoading(false))
  }, [])

  const groupCounts: Record<string, number> = {}
  orgs.forEach((o) => {
    groupCounts[o.group] = (groupCounts[o.group] || 0) + 1
  })

  const stats = [
    {
      title: "党组织总数",
      value: orgs.length,
      icon: Building2,
      desc: `${Object.entries(groupCounts).map(([g, n]) => `${g} ${n}个`).join("、")}`,
    },
    {
      title: "本年度季度评价数",
      value: quarterlyEvals.length,
      icon: ClipboardCheck,
      desc: `已覆盖 ${new Set(quarterlyEvals.map((e) => e.org_id)).size} 个组织`,
    },
    {
      title: "本年度评价",
      value: annualEvals.length,
      icon: FileSpreadsheet,
      desc: `${annualEvals.filter((e) => e.final_grade).length} 个已出结果`,
    },
    {
      title: "A级组织",
      value: annualEvals.filter((e) => e.final_grade === "A").length,
      icon: Trophy,
      desc: annualEvals.filter((e) => e.final_grade === "B").length + " 个B级 / " +
            annualEvals.filter((e) => e.final_grade === "C").length + " 个C级",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">创先争优评价管理系统</h1>
        <p className="text-muted-foreground">基层党组织季度/年度创先争优评价结果管理</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent quarterly evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">近期季度评价</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : quarterlyEvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据，请先录入季度评价。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">年度</th>
                    <th className="pb-2 font-medium">季度</th>
                    <th className="pb-2 font-medium">评价数</th>
                    <th className="pb-2 font-medium">A级</th>
                    <th className="pb-2 font-medium">B级</th>
                    <th className="pb-2 font-medium">C级</th>
                  </tr>
                </thead>
                <tbody>
                  {groupByQuarter(quarterlyEvals).map((item) => (
                    <tr key={`${item.year}-${item.quarter}`} className="border-b last:border-0">
                      <td className="py-2">{item.year}年</td>
                      <td className="py-2">第{item.quarter}季度</td>
                      <td className="py-2">{item.count}</td>
                      <td className="py-2 text-green-600 font-medium">{item.aCount}</td>
                      <td className="py-2 text-blue-600 font-medium">{item.bCount}</td>
                      <td className="py-2 text-yellow-600 font-medium">{item.cCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function groupByQuarter(evals: QuarterlyEval[]) {
  const groups = new Map<string, { year: number; quarter: number; count: number; aCount: number; bCount: number; cCount: number }>()
  for (const e of evals) {
    const key = `${e.year}-${e.quarter}`
    if (!groups.has(key)) {
      groups.set(key, { year: e.year, quarter: e.quarter, count: 0, aCount: 0, bCount: 0, cCount: 0 })
    }
    const g = groups.get(key)!
    g.count++
    if (e.final_grade === "A") g.aCount++
    else if (e.final_grade === "B") g.bCount++
    else if (e.final_grade === "C") g.cCount++
  }
  return Array.from(groups.values()).sort((a, b) => b.year - a.year || b.quarter - a.quarter)
}
