"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Key,
  ShieldAlert,
  Settings,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  requiredRole?: "admin"
  feature: string
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { name: "Files", href: "/dashboard/files", icon: FolderOpen, feature: "files" },
  { name: "User Logs", href: "/dashboard/user-logs", icon: Users, feature: "user-logs" },
  { name: "OAuth Logs", href: "/dashboard/oauth-logs", icon: Key, feature: "oauth-logs" },
  { name: "Admin Logs", href: "/dashboard/admin-logs", icon: ShieldAlert, requiredRole: "admin", feature: "admin-logs" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, feature: "settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { role, canAccess } = useRole()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "glass relative flex h-screen flex-col border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FolderOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-pretty font-semibold text-sidebar-foreground">CloudFiles</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-1.5 hover:bg-sidebar-accent">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const hasAccess = canAccess(item.feature)
            const Icon = item.icon
            const isLocked = !hasAccess

            const linkContent = (
              <Link
                href={hasAccess ? item.href : "#"}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive && hasAccess
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : hasAccess
                      ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      : "cursor-not-allowed opacity-40 text-sidebar-foreground/50",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && hasAccess && "text-sidebar-primary-foreground")} />
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {!collapsed && isLocked && <Lock className="h-3.5 w-3.5 shrink-0" />}
              </Link>
            )

            if (collapsed || isLocked) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isLocked ? "Admin-only access" : item.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.name}>{linkContent}</div>
          })}
        </nav>

        {/* Role Badge */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2">
              <span className="text-xs font-medium text-sidebar-accent-foreground">
                Role: {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              <div className={cn("h-2 w-2 rounded-full", role === "admin" ? "bg-neon-cyan" : "bg-neon-emerald")} />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}