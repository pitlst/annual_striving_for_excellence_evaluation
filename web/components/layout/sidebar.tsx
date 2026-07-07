/** Sidebar navigation component */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  Settings,
  Trophy,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "仪表板", icon: BarChart3 },
  { href: "/organizations", label: "组织管理", icon: Building2 },
  { href: "/quarterly", label: "季度评价", icon: ClipboardCheck },
  { href: "/annual", label: "年度评价", icon: FileSpreadsheet },
  { href: "/settings", label: "规则配置", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Trophy className="size-5 text-primary" />
        <span className="text-sm font-semibold">创先争优评价</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 text-xs text-muted-foreground">
        基层党组织创先争优评价管理系统 v1.0
      </div>
    </aside>
  )
}
