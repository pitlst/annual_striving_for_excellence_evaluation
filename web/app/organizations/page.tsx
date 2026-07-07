"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { orgApi } from "@/lib/api"
import { GROUP_ORDER, getGradeColor, type Organization } from "@/lib/types"

const GROUP_OPTIONS = ["党委组", "党总支组", "党支部组", "境外党组织组"]

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [formName, setFormName] = useState("")
  const [formGroup, setFormGroup] = useState("党委组")

  const loadOrgs = useCallback(async () => {
    try {
      const data = await orgApi.list()
      setOrgs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrgs() }, [loadOrgs])

  const resetForm = () => {
    setEditing(null)
    setFormName("")
    setFormGroup("党委组")
  }

  const openEdit = (org: Organization) => {
    setEditing(org)
    setFormName(org.name)
    setFormGroup(org.group)
    setDialogOpen(true)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    try {
      if (editing) {
        await orgApi.update(editing.id, { name: formName, group: formGroup })
      } else {
        await orgApi.create({ name: formName, group: formGroup })
      }
      setDialogOpen(false)
      resetForm()
      await loadOrgs()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "操作失败")
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return
    try {
      await orgApi.delete(id)
      await loadOrgs()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "删除失败")
    }
  }

  // Group organizations
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    orgs: orgs.filter((o) => o.group === g),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">组织管理</h1>
          <p className="text-muted-foreground">管理基层党组织单位字典</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> 新增组织
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑组织" : "新增组织"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>党组织名称</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="输入党组织名称" />
            </div>
            <div className="space-y-2">
              <Label>分组</Label>
              <Select value={formGroup} onValueChange={(v) => v && setFormGroup(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "保存修改" : "创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map(({ group, orgs: groupOrgs }) => (
            <Card key={group}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {group}
                  <Badge variant="outline" className="ml-auto">{groupOrgs.length}个</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupOrgs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">暂无组织</p>
                ) : (
                  <ul className="space-y-1">
                    {groupOrgs.map((org) => (
                      <li key={org.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                        <span>{org.name}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(org)}>
                            <Pencil className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(org.id, org.name)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
